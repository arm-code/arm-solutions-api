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
import { BusinessEventResponseDto } from './dto/business-event-response.dto';
import { CreateBusinessEventDto } from './dto/create-business-event.dto';
import { QueryBusinessEventDto } from './dto/query-business-event.dto';
import { UpdateBusinessEventDto } from './dto/update-business-event.dto';
import { UpdateEventStatusDto } from './dto/update-event-status.dto';
import { EventsService } from './events.service';

/**
 * Módulo de Gestión de Eventos y Alquiler de Mobiliario (`BusinessEvents`).
 * Cada evento pertenece exclusivamente al usuario autenticado (`owner_id`).
 */
@ApiTags('Business Events')
@ApiBearerAuth()
@ApiHeader({
  name: 'X-Business-ID',
  description: 'UUID del negocio activo. Requerido para todos los endpoints de este módulo.',
  required: true,
})
@UseGuards(SupabaseAuthGuard, TenantGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ResponseMessage('Evento creado exitosamente.')
  @ApiOperation({ summary: 'Crear un nuevo evento de mobiliario.' })
  @SwaggerApiResponse({
    status: 201,
    description: 'Evento creado exitosamente.',
  })
  create(
    @CurrentBusiness() businessId: string,
    @Body() dto: CreateBusinessEventDto,
  ): Promise<BusinessEventResponseDto> {
    return this.eventsService.create(businessId, dto);
  }

  @Get()
  @ResponseMessage('Eventos obtenidos exitosamente.')
  @ApiOperation({
    summary:
      'Listar eventos del usuario autenticado con filtros (tab, status, search, paginación).',
  })
  findAll(
    @CurrentBusiness() businessId: string,
    @Query() query: QueryBusinessEventDto,
  ) {
    return this.eventsService.findAll(businessId, query);
  }

  @Get(':id')
  @ResponseMessage('Evento obtenido exitosamente.')
  @ApiOperation({
    summary:
      'Obtener detalle de un evento por ID incluyendo balance financiero e información vinculada.',
  })
  @SwaggerApiResponse({
    status: 404,
    description: 'No encontrado o pertenece a otro usuario.',
  })
  findOne(
    @CurrentBusiness() businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.eventsService.findOne(businessId, id);
  }

  @Patch(':id')
  @ResponseMessage('Evento actualizado exitosamente.')
  @ApiOperation({ summary: 'Actualizar parcialmente un evento.' })
  @SwaggerApiResponse({
    status: 404,
    description: 'No encontrado o pertenece a otro usuario.',
  })
  update(
    @CurrentBusiness() businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBusinessEventDto,
  ): Promise<BusinessEventResponseDto> {
    return this.eventsService.update(businessId, id, dto);
  }

  @Patch(':id/status')
  @ResponseMessage('Estado del evento actualizado exitosamente.')
  @ApiOperation({ summary: 'Cambio rápido de estado de un evento.' })
  @SwaggerApiResponse({
    status: 404,
    description: 'No encontrado o pertenece a otro usuario.',
  })
  updateStatus(
    @CurrentBusiness() businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEventStatusDto,
  ): Promise<BusinessEventResponseDto> {
    return this.eventsService.updateStatus(businessId, id, dto.status);
  }

  @Delete(':id')
  @ResponseMessage('Evento cancelado exitosamente.')
  @ApiOperation({
    summary:
      'Cancelar evento (cambia el estado a cancelled para conservar el histórico).',
  })
  @SwaggerApiResponse({
    status: 404,
    description: 'No encontrado o pertenece a otro usuario.',
  })
  remove(
    @CurrentBusiness() businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BusinessEventResponseDto> {
    return this.eventsService.remove(businessId, id);
  }
}
