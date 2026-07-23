import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ResponseMessage } from '../../common/interceptors/transform.interceptor';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { BusinessConfigService } from './business-config.service';
import { BusinessConfigResponseDto } from './dto/business-config-response.dto';
import { CreatePaymentCardDto } from './dto/create-payment-card.dto';
import { UpdateBusinessConfigDto } from './dto/update-business-config.dto';

/**
 * Módulo de Configuración de Negocio / Información Institucional (`BusinessConfig`).
 * Alimenta la información del negocio en recibos, cotizaciones y contratos.
 */
@ApiTags('Business Config')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('config')
export class BusinessConfigController {
  constructor(
    private readonly businessConfigService: BusinessConfigService,
  ) {}

  @Get()
  @ResponseMessage('Configuración obtenida correctamente.')
  @ApiOperation({
    summary:
      'Obtener la configuración actual de la empresa (siembra inicial automática si no existe).',
  })
  @SwaggerApiResponse({
    status: 200,
    description: 'Configuración de la empresa.',
    type: BusinessConfigResponseDto,
  })
  getConfig(): Promise<BusinessConfigResponseDto> {
    return this.businessConfigService.getConfig();
  }

  @Patch()
  @ResponseMessage('Configuración actualizada correctamente.')
  @ApiOperation({
    summary: 'Actualizar parcialmente la información general de la empresa.',
  })
  @SwaggerApiResponse({
    status: 200,
    description: 'Configuración actualizada.',
    type: BusinessConfigResponseDto,
  })
  updateConfig(
    @Body() dto: UpdateBusinessConfigDto,
  ): Promise<BusinessConfigResponseDto> {
    return this.businessConfigService.updateConfig(dto);
  }

  @Post('cards')
  @ResponseMessage('Cuenta bancaria agregada correctamente.')
  @ApiOperation({
    summary: 'Agregar una nueva tarjeta o cuenta bancaria de recepción de pagos.',
  })
  @SwaggerApiResponse({
    status: 201,
    description: 'Cuenta bancaria agregada.',
    type: BusinessConfigResponseDto,
  })
  addPaymentCard(
    @Body() dto: CreatePaymentCardDto,
  ): Promise<BusinessConfigResponseDto> {
    return this.businessConfigService.addPaymentCard(dto);
  }

  @Delete('cards/:cardId')
  @ResponseMessage('Cuenta bancaria eliminada correctamente.')
  @ApiOperation({ summary: 'Eliminar una cuenta bancaria por su ID.' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Cuenta bancaria eliminada.',
    type: BusinessConfigResponseDto,
  })
  removePaymentCard(
    @Param('cardId', ParseUUIDPipe) cardId: string,
  ): Promise<BusinessConfigResponseDto> {
    return this.businessConfigService.removePaymentCard(cardId);
  }
}
