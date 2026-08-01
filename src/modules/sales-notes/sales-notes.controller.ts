import {
  Body,
  Controller,
  Delete,
  Get,
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
import { CreateSalesNoteDto } from './dto/create-sales-note.dto';
import { QuerySalesNotesDto } from './dto/query-sales-notes.dto';
import { SalesNoteResponseDto } from './dto/sales-note-response.dto';
import { UpdateSalesNoteDto } from './dto/update-sales-note.dto';
import { UpdateSalesNoteStatusDto } from './dto/update-sales-note-status.dto';
import { SalesNotesService } from './sales-notes.service';

/**
 * Módulo de Notas de Venta y Cotizaciones (`SalesNotes`).
 * Permite emitir cotizaciones y notas de venta con cálculo automático de totales.
 */
@ApiTags('Sales Notes')
@ApiBearerAuth()
@ApiHeader({
  name: 'X-Business-ID',
  description: 'UUID del negocio activo. Requerido para todos los endpoints de este módulo.',
  required: true,
})
@UseGuards(SupabaseAuthGuard, TenantGuard)
@Controller('sales-notes')
export class SalesNotesController {
  constructor(private readonly salesNotesService: SalesNotesService) {}

  @Post()
  @ResponseMessage('Nota de venta o cotización creada exitosamente.')
  @ApiOperation({ summary: 'Crear nueva nota de venta o cotización.' })
  @SwaggerApiResponse({
    status: 201,
    description: 'Creada exitosamente.',
  })
  create(
    @CurrentBusiness() businessId: string,
    @Body() dto: CreateSalesNoteDto,
  ): Promise<SalesNoteResponseDto> {
    return this.salesNotesService.create(businessId, dto);
  }

  @Get()
  @ResponseMessage('Notas de venta obtenidas exitosamente.')
  @ApiOperation({
    summary:
      'Obtener notas de venta y cotizaciones paginadas con filtros (status, eventId, search).',
  })
  findAll(
    @CurrentBusiness() businessId: string,
    @Query() query: QuerySalesNotesDto,
  ) {
    return this.salesNotesService.findAll(businessId, query);
  }

  @Get(':id')
  @ResponseMessage('Nota de venta obtenida exitosamente.')
  @ApiOperation({
    summary:
      'Obtener detalle completo de una nota o cotización por ID incluyendo sus ítems.',
  })
  @SwaggerApiResponse({
    status: 404,
    description: 'No encontrada.',
  })
  findOne(
    @CurrentBusiness() businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.salesNotesService.findOne(businessId, id);
  }

  @Patch(':id')
  @ResponseMessage('Nota de venta actualizada exitosamente.')
  @ApiOperation({ summary: 'Actualizar parcialmente una nota o cotización.' })
  @SwaggerApiResponse({
    status: 404,
    description: 'No encontrada.',
  })
  update(
    @CurrentBusiness() businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSalesNoteDto,
  ): Promise<SalesNoteResponseDto> {
    return this.salesNotesService.update(businessId, id, dto);
  }

  @Patch(':id/status')
  @ResponseMessage('Estado de la nota actualizado exitosamente.')
  @ApiOperation({
    summary: 'Convertir Cotización a Nota de Venta (o cambio de status).',
  })
  @SwaggerApiResponse({
    status: 404,
    description: 'No encontrada.',
  })
  updateStatus(
    @CurrentBusiness() businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSalesNoteStatusDto,
  ): Promise<SalesNoteResponseDto> {
    return this.salesNotesService.updateStatus(businessId, id, dto.status);
  }

  @Delete(':id')
  @ResponseMessage('Nota de venta eliminada exitosamente.')
  @ApiOperation({ summary: 'Eliminar una nota de venta o cotización.' })
  @SwaggerApiResponse({
    status: 404,
    description: 'No encontrada.',
  })
  remove(
    @CurrentBusiness() businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SalesNoteResponseDto> {
    return this.salesNotesService.remove(businessId, id);
  }
}
