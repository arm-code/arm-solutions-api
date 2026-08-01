import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
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
import { CategoriesService } from './categories.service';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { QueryCategoryDto } from './dto/query-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

/**
 * Catálogo de categorías de movimientos (RENTA, GASOLINA, COMIDAS, SUELDOS,
 * FLETES, MANTENIMIENTO, ...).
 */
@ApiTags('Categories')
@ApiBearerAuth()
@ApiHeader({
  name: 'X-Business-ID',
  description: 'UUID del negocio activo. Requerido para todos los endpoints de este módulo.',
  required: true,
})
@UseGuards(SupabaseAuthGuard, TenantGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ResponseMessage('Categoría creada exitosamente.')
  @ApiOperation({ summary: 'Crear una nueva categoría de movimiento.' })
  @SwaggerApiResponse({
    status: 201,
    description: 'Categoría creada.',
    schema: {
      example: {
        success: true,
        message: 'Categoría creada exitosamente.',
        data: {
          id: 'c8f1b2c4-1234-4d5e-8f6a-000000000002',
          code: 'PUBLICIDAD',
          name: 'Publicidad',
          description: 'Gastos de marketing y anuncios',
          isActive: true,
          createdAt: '2026-07-17T10:00:00.000Z',
          updatedAt: '2026-07-17T10:00:00.000Z',
        },
      },
    },
  })
  @SwaggerApiResponse({ status: 409, description: 'El código ya existe.' })
  create(
    @CurrentBusiness() businessId: string,
    @Body() dto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.categoriesService.create(businessId, dto);
  }

  @Get()
  @ResponseMessage('Categorías obtenidas exitosamente.')
  @ApiOperation({
    summary: 'Listar categorías (paginado, búsqueda y filtro por estado).',
  })
  findAll(
    @CurrentBusiness() businessId: string,
    @Query() query: QueryCategoryDto,
  ) {
    return this.categoriesService.findAll(businessId, query);
  }

  @Get(':id')
  @ResponseMessage('Categoría obtenida exitosamente.')
  @ApiOperation({ summary: 'Obtener una categoría por id.' })
  @SwaggerApiResponse({ status: 404, description: 'No encontrada.' })
  findOne(
    @CurrentBusiness() businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CategoryResponseDto> {
    return this.categoriesService.findOne(businessId, id);
  }

  @Patch(':id')
  @ResponseMessage('Categoría actualizada exitosamente.')
  @ApiOperation({ summary: 'Actualizar parcialmente una categoría.' })
  @SwaggerApiResponse({ status: 404, description: 'No encontrada.' })
  @SwaggerApiResponse({ status: 409, description: 'El código ya existe.' })
  update(
    @CurrentBusiness() businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.categoriesService.update(businessId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Categoría desactivada exitosamente.')
  @ApiOperation({
    summary:
      'Desactivar una categoría (soft delete, preserva histórico de transacciones).',
  })
  @SwaggerApiResponse({ status: 404, description: 'No encontrada.' })
  async remove(
    @CurrentBusiness() businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<null> {
    await this.categoriesService.remove(businessId, id);
    return null;
  }
}
