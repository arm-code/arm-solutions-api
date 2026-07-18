import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest } from '../guards/supabase-auth.guard';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

/**
 * Extrae el usuario autenticado (inyectado por `SupabaseAuthGuard`) dentro
 * de cualquier controlador: `@CurrentUser() user: AuthenticatedUser`.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
