import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import {
  AuthenticatedUser,
  SupabaseJwtPayload,
} from '../interfaces/authenticated-user.interface';

/** Extiende `Request` de Express con el usuario autenticado. */
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

/**
 * Guard de autenticación basado en Supabase Auth.
 *
 * Valida el `Authorization: Bearer <token>` verificando la firma del JWT
 * contra `SUPABASE_JWT_SECRET` (HS256). No se hace ninguna llamada de red a
 * Supabase: la verificación es local y de bajo costo, ideal para proteger
 * cada request sin penalizar la latencia.
 *
 * Uso:
 * ```ts
 * @UseGuards(SupabaseAuthGuard)
 * @Get()
 * findAll(@CurrentUser() user: AuthenticatedUser) { ... }
 * ```
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(SupabaseAuthGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException(
        'No se proporcionó un token de autenticación.',
      );
    }

    const secret = this.configService.get<string>('SUPABASE_JWT_SECRET');
    if (!secret) {
      this.logger.error(
        'SUPABASE_JWT_SECRET no está configurado en el entorno.',
      );
      throw new UnauthorizedException(
        'Configuración de autenticación inválida en el servidor.',
      );
    }

    try {
      const payload = jwt.verify(token, secret, {
        algorithms: ['HS256'],
      }) as SupabaseJwtPayload;

      request.user = {
        id: payload.sub,
        email: payload.email ?? null,
        role: payload.role ?? 'authenticated',
      };

      return true;
    } catch (error) {
      this.logger.warn(
        `Token inválido o expirado: ${(error as Error).message}`,
      );
      throw new UnauthorizedException('Token inválido o expirado.');
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) return undefined;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
