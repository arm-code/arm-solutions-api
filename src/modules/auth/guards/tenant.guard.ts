import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BusinessesService } from '../../businesses/businesses.service';
import { BusinessRole } from '../../businesses/enums/business-role.enum';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { AuthenticatedRequest } from './jwt-auth.guard';

/**
 * Guard de negocio.
 *
 * Debe usarse DESPUÉS de `JwtAuthGuard` (que ya pobló `request.user`).
 * Cada instancia atiende a un solo negocio, así que el cliente NO manda
 * ningún identificador de negocio: el guard lo resuelve y valida que el
 * usuario pertenezca a él.
 *
 * Inyecta `request.businessId` y `request.businessRole` para los controllers
 * (`@CurrentBusiness()` y `@CurrentBusinessRole()`).
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly businessesService: BusinessesService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<
      AuthenticatedRequest & { businessId?: string; businessRole?: BusinessRole }
    >();

    const business = await this.businessesService.getCurrentBusiness();
    const role = await this.businessesService.validateUserInBusiness(
      request.user.id,
      business.id,
    );

    request.businessId = business.id;
    request.businessRole = role;
    return true;
  }
}
