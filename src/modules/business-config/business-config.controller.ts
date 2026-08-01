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
  ApiHeader,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ResponseMessage } from '../../common/interceptors/transform.interceptor';
import { CurrentBusiness } from '../auth/decorators/current-business.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { BusinessesService } from '../businesses/businesses.service';
import { PublicBusinessResponseDto } from '../businesses/dto/public-business-response.dto';
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
@ApiHeader({
  name: 'X-Business-ID',
  description: 'UUID del negocio activo. Requerido para todos los endpoints de este módulo (excepto endpoints públicos).',
  required: false,
})
@UseGuards(SupabaseAuthGuard, TenantGuard)
@Controller('config')
export class BusinessConfigController {
  constructor(
    private readonly businessConfigService: BusinessConfigService,
    private readonly businessesService: BusinessesService,
  ) {}

  @Public()
  @Get('public/:slug')
  @ResponseMessage('Información pública del negocio obtenida correctamente.')
  @ApiOperation({
    summary:
      'Obtener la configuración e información pública del negocio por su slug.',
  })
  @SwaggerApiResponse({
    status: 200,
    description: 'Configuración pública del negocio.',
    type: PublicBusinessResponseDto,
  })
  getPublicConfigBySlug(
    @Param('slug') slug: string,
  ): Promise<PublicBusinessResponseDto> {
    return this.businessesService.getPublicBusinessBySlug(slug);
  }

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
  getConfig(
    @CurrentBusiness() businessId: string,
  ): Promise<BusinessConfigResponseDto> {
    return this.businessConfigService.getConfig(businessId);
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
    @CurrentBusiness() businessId: string,
    @Body() dto: UpdateBusinessConfigDto,
  ): Promise<BusinessConfigResponseDto> {
    return this.businessConfigService.updateConfig(businessId, dto);
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
    @CurrentBusiness() businessId: string,
    @Body() dto: CreatePaymentCardDto,
  ): Promise<BusinessConfigResponseDto> {
    return this.businessConfigService.addPaymentCard(businessId, dto);
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
    @CurrentBusiness() businessId: string,
    @Param('cardId', ParseUUIDPipe) cardId: string,
  ): Promise<BusinessConfigResponseDto> {
    return this.businessConfigService.removePaymentCard(businessId, cardId);
  }
}
