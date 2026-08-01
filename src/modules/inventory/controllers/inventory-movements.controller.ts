import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ResponseMessage } from '../../../common/interceptors/transform.interceptor';
import { CurrentBusiness } from '../../auth/decorators/current-business.decorator';
import { SupabaseAuthGuard } from '../../auth/guards/supabase-auth.guard';
import { TenantGuard } from '../../auth/guards/tenant.guard';
import { CreateInventoryMovementDto } from '../dto/movement/create-inventory-movement.dto';
import { QueryInventoryMovementsDto } from '../dto/movement/query-inventory-movements.dto';
import { InventoryMovementsService } from '../services/inventory-movements.service';

@ApiTags('Inventory - Movements')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Business-ID', required: true, description: 'UUID del negocio activo.' })
@UseGuards(SupabaseAuthGuard, TenantGuard)
@Controller('inventory/movements')
export class InventoryMovementsController {
  constructor(private readonly service: InventoryMovementsService) {}

  @Get()
  @ResponseMessage('Movimientos de inventario obtenidos exitosamente.')
  @ApiOperation({
    summary:
      'Listar movimientos paginados. Filtros: itemId, type, startDate, endDate.',
  })
  findAll(
    @CurrentBusiness() businessId: string,
    @Query() query: QueryInventoryMovementsDto,
  ) {
    return this.service.findAll(businessId, query);
  }

  @Post()
  @ResponseMessage('Movimiento de inventario registrado exitosamente.')
  @ApiOperation({
    summary:
      'Registrar un movimiento de stock (entrada, salida, traspaso o ajuste). Operación transaccional.',
  })
  create(
    @CurrentBusiness() businessId: string,
    @Body() dto: CreateInventoryMovementDto,
  ) {
    return this.service.create(businessId, dto);
  }
}
