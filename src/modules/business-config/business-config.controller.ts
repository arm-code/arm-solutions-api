import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
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
import {
  CreateBusinessStatDto,
  UpdateBusinessStatDto,
} from './dto/business-stat.dto';
import {
  CreateBusinessValueDto,
  UpdateBusinessValueDto,
} from './dto/business-value.dto';
import { BusinessConfigResponseDto } from './dto/business-config-response.dto';
import { CreateFaqDto, UpdateFaqDto } from './dto/faq.dto';
import { CreatePaymentCardDto } from './dto/create-payment-card.dto';
import {
  CreateTestimonialDto,
  UpdateTestimonialDto,
} from './dto/testimonial.dto';
import { UpdateBusinessConfigDto } from './dto/update-business-config.dto';
import { UpdateGalleryItemDto } from './dto/update-gallery-item.dto';

/**
 * Módulo de Configuración de Negocio / Información Institucional (`BusinessConfig`).
 * Alimenta la información del negocio en recibos, cotizaciones, contratos y landing público.
 */
@ApiTags('Business Config')
@ApiBearerAuth()
@ApiHeader({
  name: 'X-Business-ID',
  description:
    'UUID del negocio activo. Requerido para todos los endpoints de este módulo (excepto endpoints públicos).',
  required: false,
})
@UseGuards(SupabaseAuthGuard, TenantGuard)
@Controller('config')
export class BusinessConfigController {
  constructor(
    private readonly businessConfigService: BusinessConfigService,
    private readonly businessesService: BusinessesService,
  ) {}

  // ── Endpoint público ─────────────────────────────────────────────────────────

  @Public()
  @Get('public/:slug')
  @ResponseMessage('Información pública del negocio obtenida correctamente.')
  @ApiOperation({
    summary: 'Obtener la configuración e información pública del negocio por su slug.',
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

  // ── Config general ───────────────────────────────────────────────────────────

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

  // ── Logo ─────────────────────────────────────────────────────────────────────

  @Post('logo')
  @ResponseMessage('Logotipo actualizado correctamente.')
  @ApiOperation({
    summary:
      'Subir o reemplazar el logotipo del negocio. ' +
      'La imagen se almacena en Supabase Storage y se actualiza la URL en la configuración.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Imagen del logo (jpg, jpeg, png, webp, gif, avif — máx. 10 MB).',
        },
      },
    },
  })
  @SwaggerApiResponse({
    status: 201,
    description: 'Configuración con el nuevo logoUrl.',
    type: BusinessConfigResponseDto,
  })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  uploadLogo(
    @CurrentBusiness() businessId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<BusinessConfigResponseDto> {
    return this.businessConfigService.uploadLogo(
      businessId,
      file.buffer,
      file.originalname,
    );
  }

  // ── Payment Cards ────────────────────────────────────────────────────────────

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

  // ── Gallery ──────────────────────────────────────────────────────────────────

  @Post('gallery')
  @ResponseMessage('Imagen agregada a la galería correctamente.')
  @ApiOperation({
    summary:
      'Subir una imagen al catálogo/galería del negocio. ' +
      'Se almacena en Supabase Storage. ' +
      'Envía la imagen en el campo "file" y los metadatos como campos de formulario.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'Imagen (máx. 10 MB).' },
        label: { type: 'string', example: 'Mesas y sillas', description: 'Etiqueta visible.' },
        alt: { type: 'string', example: 'Fotografía de mesas y sillas', description: 'Texto alternativo accesible.' },
        order: { type: 'integer', example: 1, description: 'Posición en el carrusel.' },
      },
    },
  })
  @SwaggerApiResponse({
    status: 201,
    description: 'Configuración actualizada con la nueva imagen en gallery.',
    type: BusinessConfigResponseDto,
  })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  addGalleryImage(
    @CurrentBusiness() businessId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UpdateGalleryItemDto,
  ): Promise<BusinessConfigResponseDto> {
    return this.businessConfigService.addGalleryImage(
      businessId,
      file.buffer,
      file.originalname,
      dto,
    );
  }

  @Patch('gallery/:itemId')
  @ResponseMessage('Item de galería actualizado correctamente.')
  @ApiOperation({
    summary:
      'Actualizar los metadatos (label, alt, order) de un item de galería. ' +
      'No reemplaza la imagen.',
  })
  @SwaggerApiResponse({
    status: 200,
    description: 'Configuración actualizada.',
    type: BusinessConfigResponseDto,
  })
  updateGalleryItem(
    @CurrentBusiness() businessId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateGalleryItemDto,
  ): Promise<BusinessConfigResponseDto> {
    return this.businessConfigService.updateGalleryItem(businessId, itemId, dto);
  }

  @Delete('gallery/:itemId')
  @ResponseMessage('Imagen eliminada de la galería correctamente.')
  @ApiOperation({
    summary: 'Eliminar una imagen de la galería (BD + Supabase Storage).',
  })
  @SwaggerApiResponse({
    status: 200,
    description: 'Imagen eliminada.',
    type: BusinessConfigResponseDto,
  })
  removeGalleryItem(
    @CurrentBusiness() businessId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<BusinessConfigResponseDto> {
    return this.businessConfigService.removeGalleryItem(businessId, itemId);
  }

  // ── Values ───────────────────────────────────────────────────────────────────

  @Post('values')
  @ResponseMessage('Valor corporativo agregado correctamente.')
  @ApiOperation({ summary: 'Agregar un valor corporativo al landing público.' })
  @SwaggerApiResponse({ status: 201, type: BusinessConfigResponseDto })
  addValue(
    @CurrentBusiness() businessId: string,
    @Body() dto: CreateBusinessValueDto,
  ): Promise<BusinessConfigResponseDto> {
    return this.businessConfigService.addValue(businessId, dto);
  }

  @Patch('values/:valueId')
  @ResponseMessage('Valor corporativo actualizado correctamente.')
  @ApiOperation({ summary: 'Actualizar un valor corporativo.' })
  @SwaggerApiResponse({ status: 200, type: BusinessConfigResponseDto })
  updateValue(
    @CurrentBusiness() businessId: string,
    @Param('valueId', ParseUUIDPipe) valueId: string,
    @Body() dto: UpdateBusinessValueDto,
  ): Promise<BusinessConfigResponseDto> {
    return this.businessConfigService.updateValue(businessId, valueId, dto);
  }

  @Delete('values/:valueId')
  @ResponseMessage('Valor corporativo eliminado correctamente.')
  @ApiOperation({ summary: 'Eliminar un valor corporativo.' })
  @SwaggerApiResponse({ status: 200, type: BusinessConfigResponseDto })
  removeValue(
    @CurrentBusiness() businessId: string,
    @Param('valueId', ParseUUIDPipe) valueId: string,
  ): Promise<BusinessConfigResponseDto> {
    return this.businessConfigService.removeValue(businessId, valueId);
  }

  // ── Stats ────────────────────────────────────────────────────────────────────

  @Post('stats')
  @ResponseMessage('Estadística agregada correctamente.')
  @ApiOperation({ summary: 'Agregar una métrica a la sección "En números".' })
  @SwaggerApiResponse({ status: 201, type: BusinessConfigResponseDto })
  addStat(
    @CurrentBusiness() businessId: string,
    @Body() dto: CreateBusinessStatDto,
  ): Promise<BusinessConfigResponseDto> {
    return this.businessConfigService.addStat(businessId, dto);
  }

  @Patch('stats/:statId')
  @ResponseMessage('Estadística actualizada correctamente.')
  @ApiOperation({ summary: 'Actualizar una métrica.' })
  @SwaggerApiResponse({ status: 200, type: BusinessConfigResponseDto })
  updateStat(
    @CurrentBusiness() businessId: string,
    @Param('statId', ParseUUIDPipe) statId: string,
    @Body() dto: UpdateBusinessStatDto,
  ): Promise<BusinessConfigResponseDto> {
    return this.businessConfigService.updateStat(businessId, statId, dto);
  }

  @Delete('stats/:statId')
  @ResponseMessage('Estadística eliminada correctamente.')
  @ApiOperation({ summary: 'Eliminar una métrica.' })
  @SwaggerApiResponse({ status: 200, type: BusinessConfigResponseDto })
  removeStat(
    @CurrentBusiness() businessId: string,
    @Param('statId', ParseUUIDPipe) statId: string,
  ): Promise<BusinessConfigResponseDto> {
    return this.businessConfigService.removeStat(businessId, statId);
  }

  // ── Testimonials ─────────────────────────────────────────────────────────────

  @Post('testimonials')
  @ResponseMessage('Testimonio agregado correctamente.')
  @ApiOperation({ summary: 'Agregar un testimonio de cliente.' })
  @SwaggerApiResponse({ status: 201, type: BusinessConfigResponseDto })
  addTestimonial(
    @CurrentBusiness() businessId: string,
    @Body() dto: CreateTestimonialDto,
  ): Promise<BusinessConfigResponseDto> {
    return this.businessConfigService.addTestimonial(businessId, dto);
  }

  @Patch('testimonials/:testimonialId')
  @ResponseMessage('Testimonio actualizado correctamente.')
  @ApiOperation({ summary: 'Actualizar un testimonio de cliente.' })
  @SwaggerApiResponse({ status: 200, type: BusinessConfigResponseDto })
  updateTestimonial(
    @CurrentBusiness() businessId: string,
    @Param('testimonialId', ParseUUIDPipe) testimonialId: string,
    @Body() dto: UpdateTestimonialDto,
  ): Promise<BusinessConfigResponseDto> {
    return this.businessConfigService.updateTestimonial(businessId, testimonialId, dto);
  }

  @Delete('testimonials/:testimonialId')
  @ResponseMessage('Testimonio eliminado correctamente.')
  @ApiOperation({ summary: 'Eliminar un testimonio de cliente.' })
  @SwaggerApiResponse({ status: 200, type: BusinessConfigResponseDto })
  removeTestimonial(
    @CurrentBusiness() businessId: string,
    @Param('testimonialId', ParseUUIDPipe) testimonialId: string,
  ): Promise<BusinessConfigResponseDto> {
    return this.businessConfigService.removeTestimonial(businessId, testimonialId);
  }

  // ── FAQs ─────────────────────────────────────────────────────────────────────

  @Post('faqs')
  @ResponseMessage('Pregunta frecuente agregada correctamente.')
  @ApiOperation({ summary: 'Agregar una pregunta frecuente.' })
  @SwaggerApiResponse({ status: 201, type: BusinessConfigResponseDto })
  addFaq(
    @CurrentBusiness() businessId: string,
    @Body() dto: CreateFaqDto,
  ): Promise<BusinessConfigResponseDto> {
    return this.businessConfigService.addFaq(businessId, dto);
  }

  @Patch('faqs/:faqId')
  @ResponseMessage('Pregunta frecuente actualizada correctamente.')
  @ApiOperation({ summary: 'Actualizar una pregunta frecuente.' })
  @SwaggerApiResponse({ status: 200, type: BusinessConfigResponseDto })
  updateFaq(
    @CurrentBusiness() businessId: string,
    @Param('faqId', ParseUUIDPipe) faqId: string,
    @Body() dto: UpdateFaqDto,
  ): Promise<BusinessConfigResponseDto> {
    return this.businessConfigService.updateFaq(businessId, faqId, dto);
  }

  @Delete('faqs/:faqId')
  @ResponseMessage('Pregunta frecuente eliminada correctamente.')
  @ApiOperation({ summary: 'Eliminar una pregunta frecuente.' })
  @SwaggerApiResponse({ status: 200, type: BusinessConfigResponseDto })
  removeFaq(
    @CurrentBusiness() businessId: string,
    @Param('faqId', ParseUUIDPipe) faqId: string,
  ): Promise<BusinessConfigResponseDto> {
    return this.businessConfigService.removeFaq(businessId, faqId);
  }
}
