import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { BusinessRole } from '../../businesses/enums/business-role.enum';

/**
 * Extrae el `businessId` inyectado por `TenantGuard` en el request.
 *
 * Uso: `@CurrentBusiness() businessId: string`
 */
export const CurrentBusiness = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<{ businessId: string }>();
    return request.businessId;
  },
);

/**
 * Extrae el `businessRole` inyectado por `TenantGuard` en el request.
 * Útil para implementar lógica condicional por rol en los controllers.
 *
 * Uso: `@CurrentBusinessRole() role: BusinessRole`
 */
export const CurrentBusinessRole = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): BusinessRole => {
    const request = ctx.switchToHttp().getRequest<{ businessRole: BusinessRole }>();
    return request.businessRole;
  },
);
