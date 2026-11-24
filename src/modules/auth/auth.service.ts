import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { Repository } from 'typeorm';
import { SESSION_TTL_SECONDS } from './auth.constants';
import { User } from './entities/user.entity';

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;

/**
 * Límite de intentos fallidos en memoria. Se cuenta por IP+email y también por
 * email solo (con un tope mayor), para frenar la fuerza bruta sin que un
 * atacante pueda bloquear al dueño con facilidad.
 */
class LoginThrottle {
  private readonly hits = new Map<string, { count: number; first: number }>();

  private read(key: string) {
    const entry = this.hits.get(key);
    if (entry && Date.now() - entry.first > WINDOW_MS) {
      this.hits.delete(key);
      return undefined;
    }
    return entry;
  }

  isBlocked(ipKey: string, emailKey: string): boolean {
    return (
      (this.read(ipKey)?.count ?? 0) >= MAX_FAILURES ||
      (this.read(emailKey)?.count ?? 0) >= MAX_FAILURES * 4
    );
  }

  fail(...keys: string[]) {
    for (const key of keys) {
      const entry = this.read(key);
      if (entry) entry.count += 1;
      else this.hits.set(key, { count: 1, first: Date.now() });
    }
    if (this.hits.size > 10_000) this.hits.clear(); // tope de memoria
  }

  reset(...keys: string[]) {
    keys.forEach((k) => this.hits.delete(k));
  }
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly throttle = new LoginThrottle();

  /** Hash válido de una contraseña al azar: gasta el mismo tiempo si el usuario no existe. */
  private readonly dummyHash = bcrypt.hashSync(`dummy-${Math.random()}`, 12);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async login(email: string, password: string, ip: string) {
    const normalized = email.trim().toLowerCase();
    const ipKey = `${ip}|${normalized}`;
    const emailKey = `e|${normalized}`;

    if (this.throttle.isBlocked(ipKey, emailKey)) {
      throw new HttpException(
        'Demasiados intentos fallidos. Intenta de nuevo en unos minutos.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const user = await this.users
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.email = :email', { email: normalized })
      .getOne();

    // Siempre se compara contra un hash para no revelar si el usuario existe
    const valid = await bcrypt.compare(password, user?.passwordHash ?? this.dummyHash);

    if (!user || !user.passwordHash || !user.isActive || !valid) {
      this.throttle.fail(ipKey, emailKey);
      this.logger.warn(`Login fallido para ${normalized} desde ${ip}`);
      throw new UnauthorizedException('Correo o contraseña incorrectos.');
    }

    this.throttle.reset(ipKey, emailKey);
    return { user: { id: user.id, email: user.email }, token: this.signToken(user) };
  }

  async getUserById(id: string) {
    const user = await this.users.findOne({ where: { id, isActive: true } });
    if (!user) throw new UnauthorizedException('Sesión inválida.');
    return { id: user.id, email: user.email };
  }

  private signToken(user: User): string {
    const secret = this.configService.getOrThrow<string>('JWT_SECRET');
    return jwt.sign({ email: user.email, role: 'authenticated' }, secret, {
      algorithm: 'HS256',
      subject: user.id,
      expiresIn: SESSION_TTL_SECONDS,
    });
  }
}
