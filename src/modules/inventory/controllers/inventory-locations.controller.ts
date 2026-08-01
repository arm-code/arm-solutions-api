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
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ResponseMessage } from '../../../common/interceptors/transform.interceptor';
import { CurrentBusiness } from '../../auth/decorators/current-business.decorator';
import { SupabaseAuthGuard } from '../../auth/guards/supabase-auth.guard';
import { TenantGuard } from '../../auth/guards/tenant.guard';
import { CreateInventoryLocationDto } from '../dto/location/create-inventory-location.dto';
import { UpdateInventoryLocationDto } from '../dto/location/update-inventory-location.dto';
import { InventoryLocationsService } from '../services/inventory-locations.service';

@ApiTags('Inventory - Locations')
@ApiBearerAuth()
@ApiHeader({ name: 'X-Business-ID', required: true, description: 'UUID del negocio activo.' })
@UseGuards(SupabaseAuthGuard, TenantGuard)
@Controller('inventory/locations')
export class InventoryLocationsController {
  constructor(private readonly service: InventoryLocationsService) {}

  @Get()
  @ResponseMessage('Ubicaciones de inventario obtenidas exitosamente.')
  @ApiOperation({ summary: 'Listar todas las ubicaciones activas del negocio.' })
  findAll(@CurrentBusiness() businessId: string) {
    return this.service.findAll(businessId);
  }

  @Post()
  @ResponseMessage('Ubicación de inventario creada exitosamente.')
  @ApiOperation({ summary: 'Crear una nueva bodega, sala o vehículo.' })
  create(
    @CurrentBusiness() businessId: string,
    @Body() dto: CreateInventoryLocationDto,
  ) {
    return this.service.create(businessId, dto);
  }

  @Put(':id')
  @ResponseMessage('Ubicación de inventario actualizada exitosamente.')
  @ApiOperation({ summary: 'Actualizar nombre o tipo de una ubicación.' })
  @ApiResponse({ status: 404, description: 'Ubicación no encontrada.' })
  update(
    @CurrentBusiness() businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInventoryLocationDto,
  ) {
    return this.service.update(businessId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ResponseMessage('Ubicación de inventario eliminada exitosamente.')
  @ApiOperation({ summary: 'Eliminar (soft delete) una ubicación de inventario.' })
  @ApiResponse({ status: 404, description: 'Ubicación no encontrada.' })
  remove(
    @CurrentBusiness() businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.remove(businessId, id);
  }
}
