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
  Query,
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
import { CreateInventoryItemDto } from '../dto/item/create-inventory-item.dto';
import { QueryInventoryItemsDto } from '../dto/item/query-inventory-items.dto';
import { UpdateInventoryItemDto } from '../dto/item/update-inventory-item.dto';
import { InventoryItemsService } from '../services/inventory-items.service';

@ApiTags('Inventory - Items')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('inventory/items')
export class InventoryItemsController {
  constructor(private readonly service: InventoryItemsService) {}

  @Get()
  @ResponseMessage('Ítems de inventario obtenidos exitosamente.')
  @ApiOperation({
    summary: 'Listar ítems de inventario paginados. Filtros: search, categoryId, status, type.',
  })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryInventoryItemsDto,
  ) {
    return this.service.findAll(user.id, query);
  }

  @Get(':id')
  @ResponseMessage('Ítem de inventario obtenido exitosamente.')
  @ApiOperation({
    summary:
      'Detalle completo de un ítem. Incluye seriales si type === "serialized".',
  })
  @ApiResponse({ status: 404, description: 'Ítem no encontrado.' })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.findOne(user.id, id);
  }

  @Post()
  @ResponseMessage('Ítem de inventario creado exitosamente.')
  @ApiOperation({ summary: 'Crear un nuevo ítem de inventario.' })
  @ApiResponse({ status: 409, description: 'El SKU ya existe para este negocio.' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInventoryItemDto,
  ) {
    return this.service.create(user.id, dto);
  }

  @Put(':id')
  @ResponseMessage('Ítem de inventario actualizado exitosamente.')
  @ApiOperation({ summary: 'Actualizar datos generales, precios o atributos de un ítem.' })
  @ApiResponse({ status: 404, description: 'Ítem no encontrado.' })
  @ApiResponse({ status: 409, description: 'El SKU ya existe para este negocio.' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInventoryItemDto,
  ) {
    return this.service.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Ítem de inventario desactivado exitosamente (soft delete).')
  @ApiOperation({
    summary: 'Eliminación lógica del ítem. No borra el registro para preservar historiales.',
  })
  @ApiResponse({ status: 404, description: 'Ítem no encontrado.' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.remove(user.id, id);
  }
}
