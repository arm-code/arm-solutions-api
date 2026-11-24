import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { SESSION_COOKIE_NAME } from '../auth.constants';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthenticatedUser, JwtPayload } from '../interfaces/authenticated-user.interface';

/** Extiende `Request` de Express con el usuario autenticado. */
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

/**
 * Guard de autenticación por JWT (HS256, firmado con `JWT_SECRET`).
 *
 * El token se lee de la cookie httpOnly de sesión o, como alternativa para
 * herramientas (curl, Scalar), del header `Authorization: Bearer <token>`.
 * La verificación es local: no hay llamadas de red ni a la base de datos.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('No se proporcionó un token de autenticación.');
    }

    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      this.logger.error('JWT_SECRET no está configurado en el entorno.');
      throw new UnauthorizedException('Configuración de autenticación inválida en el servidor.');
    }

    try {
      const payload = jwt.verify(token, secret, { algorithms: ['HS256'] }) as JwtPayload;
      request.user = {
        id: payload.sub,
        email: payload.email ?? null,
        role: payload.role ?? 'authenticated',
      };
      return true;
    } catch (error) {
      this.logger.warn(`Token inválido o expirado: ${(error as Error).message}`);
      throw new UnauthorizedException('Token inválido o expirado.');
    }
  }

  private extractToken(request: Request): string | undefined {
    const fromCookie = this.readCookie(request.headers.cookie, SESSION_COOKIE_NAME);
    if (fromCookie) return fromCookie;

    const [type, token] = (request.headers.authorization ?? '').split(' ');
    return type === 'Bearer' ? token : undefined;
  }

  private readCookie(header: string | undefined, name: string): string | undefined {
    if (!header) return undefined;
    for (const part of header.split(';')) {
      const idx = part.indexOf('=');
      if (idx > 0 && part.slice(0, idx).trim() === name) {
        try {
          return decodeURIComponent(part.slice(idx + 1).trim());
        } catch {
          return undefined;
        }
      }
    }
    return undefined;
  }
}
