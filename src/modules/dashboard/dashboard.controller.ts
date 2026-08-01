import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ResponseMessage } from '../../common/interceptors/transform.interceptor';
import { CurrentBusiness } from '../auth/decorators/current-business.decorator';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { DashboardService } from './dashboard.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

/**
 * KPIs financieros del usuario autenticado. Equivalente normalizado de la
 * hoja `dashboard` del Excel original.
 */
@ApiTags('Dashboard')
@ApiBearerAuth()
@ApiHeader({
  name: 'X-Business-ID',
  description: 'UUID del negocio activo. Requerido para todos los endpoints de este módulo.',
  required: true,
})
@UseGuards(SupabaseAuthGuard, TenantGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ResponseMessage('Resumen financiero obtenido exitosamente.')
  @ApiOperation({
    summary:
      'Obtener saldo neto, ingresos, egresos y disponible por método de pago.',
    description:
      'Acepta un rango de fechas opcional (dateFrom/dateTo) para acotar el cálculo, igual que se filtraría manualmente en la hoja de cálculo original.',
  })
  @SwaggerApiResponse({
    status: 200,
    description: 'Resumen financiero.',
    schema: {
      example: {
        success: true,
        message: 'Resumen financiero obtenido exitosamente.',
        data: {
          totalIncome: 1550,
          totalExpenses: 0,
          netBalance: 1550,
          availableCash: 0,
          availableTransfer: 1550,
        },
      },
    },
  })
  getSummary(
    @CurrentBusiness() businessId: string,
    @Query() query: DashboardQueryDto,
  ) {
    return this.dashboardService.getSummary(businessId, query);
  }
}
