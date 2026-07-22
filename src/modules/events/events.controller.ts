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
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ResponseMessage } from '../../common/interceptors/transform.interceptor';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
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
@UseGuards(SupabaseAuthGuard)
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
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBusinessEventDto,
  ): Promise<BusinessEventResponseDto> {
    return this.eventsService.create(user.id, dto);
  }

  @Get()
  @ResponseMessage('Eventos obtenidos exitosamente.')
  @ApiOperation({
    summary:
      'Listar eventos del usuario autenticado con filtros (tab, status, search, paginación).',
  })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryBusinessEventDto,
  ) {
    return this.eventsService.findAll(user.id, query);
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
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.eventsService.findOne(user.id, id);
  }

  @Patch(':id')
  @ResponseMessage('Evento actualizado exitosamente.')
  @ApiOperation({ summary: 'Actualizar parcialmente un evento.' })
  @SwaggerApiResponse({
    status: 404,
    description: 'No encontrado o pertenece a otro usuario.',
  })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBusinessEventDto,
  ): Promise<BusinessEventResponseDto> {
    return this.eventsService.update(user.id, id, dto);
  }

  @Patch(':id/status')
  @ResponseMessage('Estado del evento actualizado exitosamente.')
  @ApiOperation({ summary: 'Cambio rápido de estado de un evento.' })
  @SwaggerApiResponse({
    status: 404,
    description: 'No encontrado o pertenece a otro usuario.',
  })
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEventStatusDto,
  ): Promise<BusinessEventResponseDto> {
    return this.eventsService.updateStatus(user.id, id, dto.status);
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
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BusinessEventResponseDto> {
    return this.eventsService.remove(user.id, id);
  }
}
