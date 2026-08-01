import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { BusinessesService } from '../../businesses/businesses.service';
import { BusinessRole } from '../../businesses/enums/business-role.enum';
import type { AuthenticatedRequest } from './supabase-auth.guard';

/**
 * Guard de tenant (multi-negocio).
 *
 * Debe usarse DESPUÉS de `SupabaseAuthGuard` (que ya validó el JWT y
 * pobló `request.user`).
 *
 * Flujo:
 *   1. Lee el header `x-business-id` del request.
 *   2. Valida que sea un UUID válido.
 *   3. Consulta `BusinessesService.validateUserInBusiness` para verificar
 *      que el usuario autenticado pertenece a ese negocio.
 *   4. Inyecta `request.businessId` y `request.businessRole` para que los
 *      controllers y servicios los consuman.
 *
 * Uso en un controller:
 * ```ts
 * @UseGuards(SupabaseAuthGuard, TenantGuard)
 * @Get()
 * findAll(
 *   @CurrentBusiness() businessId: string,
 *   @CurrentBusinessRole() role: BusinessRole,
 * ) { ... }
 * ```
 */
@Injectable()
export class TenantGuard implements CanActivate {
  private readonly logger = new Logger(TenantGuard.name);

  /** Regex para validar UUID v4 sin dependencias externas. */
  private readonly UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  constructor(private readonly businessesService: BusinessesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<
      AuthenticatedRequest & { businessId?: string; businessRole?: BusinessRole }
    >();

    // 1. Leer el header x-business-id
    const businessId = request.headers['x-business-id'] as string | undefined;

    if (!businessId) {
      throw new ForbiddenException(
        'Se requiere el header "X-Business-ID" para acceder a este recurso.',
      );
    }

    // 2. Validar formato UUID
    if (!this.UUID_REGEX.test(businessId)) {
      throw new ForbiddenException(
        'El header "X-Business-ID" no es un UUID válido.',
      );
    }

    // 3. Validar membresía del usuario en el negocio
    const role = await this.businessesService.validateUserInBusiness(
      request.user.id,
      businessId,
    );

    // 4. Inyectar en el request para consumo en controllers/services
    request.businessId = businessId;
    request.businessRole = role;

    this.logger.debug(
      `Usuario ${request.user.id} accedió al negocio ${businessId} con rol "${role}".`,
    );

    return true;
  }
}
