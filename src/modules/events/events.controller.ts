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
import { EventsService } from './events.service';

/**
 * Eventos/proyectos/clientes a los que se asocian transacciones
 * (ej. "EVENTO NEGRO TALIBAN"). Cada evento pertenece exclusivamente al
 * usuario autenticado que lo creó (`owner_id`).
 */
@ApiTags('Business Events')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ResponseMessage('Evento creado exitosamente.')
  @ApiOperation({ summary: 'Crear un nuevo evento/proyecto.' })
  @SwaggerApiResponse({
    status: 201,
    description: 'Evento creado.',
    schema: {
      example: {
        success: true,
        message: 'Evento creado exitosamente.',
        data: {
          id: 'e1f1b2c4-1234-4d5e-8f6a-000000000003',
          name: 'EVENTO NEGRO TALIBAN',
          clientName: 'Juan Pérez',
          eventDate: '2026-07-17',
          notes: '10 mesas + 80 sillas + brincolín.',
          isActive: true,
          createdAt: '2026-07-17T10:00:00.000Z',
          updatedAt: '2026-07-17T10:00:00.000Z',
        },
      },
    },
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
      'Listar eventos del usuario autenticado (paginado, búsqueda, filtro).',
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
      'Obtener un evento por id, incluyendo su balance financiero (ingresos, egresos, neto).',
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

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Evento desactivado exitosamente.')
  @ApiOperation({
    summary:
      'Desactivar un evento (soft delete, preserva histórico de transacciones).',
  })
  @SwaggerApiResponse({
    status: 404,
    description: 'No encontrado o pertenece a otro usuario.',
  })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<null> {
    await this.eventsService.remove(user.id, id);
    return null;
  }
}
