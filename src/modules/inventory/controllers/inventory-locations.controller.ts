import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ResponseMessage } from '../../../common/interceptors/transform.interceptor';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../../auth/guards/supabase-auth.guard';
import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { CreateInventoryLocationDto } from '../dto/location/create-inventory-location.dto';
import { UpdateInventoryLocationDto } from '../dto/location/update-inventory-location.dto';
import { InventoryLocationsService } from '../services/inventory-locations.service';

@ApiTags('Inventory - Locations')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('inventory/locations')
export class InventoryLocationsController {
  constructor(private readonly service: InventoryLocationsService) {}

  @Get()
  @ResponseMessage('Ubicaciones de inventario obtenidas exitosamente.')
  @ApiOperation({ summary: 'Listar todas las ubicaciones activas del negocio.' })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.service.findAll(user.id);
  }

  @Post()
  @ResponseMessage('Ubicación de inventario creada exitosamente.')
  @ApiOperation({ summary: 'Crear una nueva bodega, sala o vehículo.' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInventoryLocationDto,
  ) {
    return this.service.create(user.id, dto);
  }

  @Put(':id')
  @ResponseMessage('Ubicación de inventario actualizada exitosamente.')
  @ApiOperation({ summary: 'Actualizar nombre o tipo de una ubicación.' })
  @ApiResponse({ status: 404, description: 'Ubicación no encontrada.' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInventoryLocationDto,
  ) {
    return this.service.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ResponseMessage('Ubicación de inventario eliminada exitosamente.')
  @ApiOperation({ summary: 'Eliminar (soft delete) una ubicación de inventario.' })
  @ApiResponse({ status: 404, description: 'Ubicación no encontrada.' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.remove(user.id, id);
  }
}
