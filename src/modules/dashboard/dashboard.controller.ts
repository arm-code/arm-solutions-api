import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ResponseMessage } from '../../common/interceptors/transform.interceptor';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { DashboardService } from './dashboard.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

/**
 * KPIs financieros del usuario autenticado. Equivalente normalizado de la
 * hoja `dashboard` del Excel original.
 */
@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
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
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: DashboardQueryDto,
  ) {
    return this.dashboardService.getSummary(user.id, query);
  }
}
