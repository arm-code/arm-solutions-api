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
import { CreateInventoryCategoryDto } from '../dto/category/create-inventory-category.dto';
import { UpdateInventoryCategoryDto } from '../dto/category/update-inventory-category.dto';
import { InventoryCategoriesService } from '../services/inventory-categories.service';

@ApiTags('Inventory - Categories')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('inventory/categories')
export class InventoryCategoriesController {
  constructor(private readonly service: InventoryCategoriesService) {}

  @Get()
  @ResponseMessage('Categorías de inventario obtenidas exitosamente.')
  @ApiOperation({ summary: 'Listar todas las categorías de inventario del negocio.' })
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.service.findAll(user.id);
  }

  @Post()
  @ResponseMessage('Categoría de inventario creada exitosamente.')
  @ApiOperation({ summary: 'Crear una nueva categoría de inventario con atributos dinámicos.' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInventoryCategoryDto,
  ) {
    return this.service.create(user.id, dto);
  }

  @Put(':id')
  @ResponseMessage('Categoría de inventario actualizada exitosamente.')
  @ApiOperation({ summary: 'Actualizar nombre, color o atributos de una categoría.' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada.' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInventoryCategoryDto,
  ) {
    return this.service.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ResponseMessage('Categoría de inventario eliminada exitosamente.')
  @ApiOperation({
    summary: 'Eliminar una categoría. Retorna 409 si tiene ítems activos asociados.',
  })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada.' })
  @ApiResponse({ status: 409, description: 'La categoría tiene ítems activos asociados.' })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.remove(user.id, id);
  }
}
