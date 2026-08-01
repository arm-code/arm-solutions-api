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
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ResponseMessage } from '../../../common/interceptors/transform.interceptor';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../../auth/guards/supabase-auth.guard';
import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { CreateInventoryMovementDto } from '../dto/movement/create-inventory-movement.dto';
import { QueryInventoryMovementsDto } from '../dto/movement/query-inventory-movements.dto';
import { InventoryMovementsService } from '../services/inventory-movements.service';

@ApiTags('Inventory - Movements')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
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
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryInventoryMovementsDto,
  ) {
    return this.service.findAll(user.id, query);
  }

  @Post()
  @ResponseMessage('Movimiento de inventario registrado exitosamente.')
  @ApiOperation({
    summary:
      'Registrar un movimiento de stock (entrada, salida, traspaso o ajuste). Operación transaccional.',
  })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInventoryMovementDto,
  ) {
    return this.service.create(user.id, dto);
  }
}
