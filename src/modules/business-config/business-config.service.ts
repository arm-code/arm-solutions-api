import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupabaseStorageService } from '../../common/services/supabase-storage.service';
import { BusinessConfigResponseDto } from './dto/business-config-response.dto';
import {
  CreateBusinessStatDto,
  UpdateBusinessStatDto,
} from './dto/business-stat.dto';
import {
  CreateBusinessValueDto,
  UpdateBusinessValueDto,
} from './dto/business-value.dto';
import { CreateFaqDto, UpdateFaqDto } from './dto/faq.dto';
import {
  CreateTestimonialDto,
  UpdateTestimonialDto,
} from './dto/testimonial.dto';
import { UpdateBusinessConfigDto } from './dto/update-business-config.dto';
import { UpdateGalleryItemDto } from './dto/update-gallery-item.dto';
import { UpdatePaymentCardDto } from './dto/update-payment-card.dto';
import { BusinessConfig } from './entities/business-config.entity';
import { BusinessStat } from './entities/business-stat.entity';
import { BusinessValue } from './entities/business-value.entity';
import { Faq } from './entities/faq.entity';
import { GalleryItem } from './entities/gallery-item.entity';
import { PaymentCard } from './entities/payment-card.entity';
import { Testimonial } from './entities/testimonial.entity';
import { CreatePaymentCardDto } from './dto/create-payment-card.dto';

@Injectable()
export class BusinessConfigService {
  private readonly logger = new Logger(BusinessConfigService.name);

  constructor(
    @InjectRepository(BusinessConfig)
    private readonly configRepository: Repository<BusinessConfig>,
    @InjectRepository(PaymentCard)
    private readonly cardRepository: Repository<PaymentCard>,
    @InjectRepository(GalleryItem)
    private readonly galleryRepository: Repository<GalleryItem>,
    @InjectRepository(BusinessValue)
    private readonly valueRepository: Repository<BusinessValue>,
    @InjectRepository(BusinessStat)
    private readonly statRepository: Repository<BusinessStat>,
    @InjectRepository(Testimonial)
    private readonly testimonialRepository: Repository<Testimonial>,
    @InjectRepository(Faq)
    private readonly faqRepository: Repository<Faq>,
    private readonly storageService: SupabaseStorageService,
  ) { }

  // ── Config general ───────────────────────────────────────────────────────────

  async getConfig(businessId: string): Promise<BusinessConfigResponseDto> {
    const config = await this.getOrCreateDefaultConfig(businessId);
    return BusinessConfigResponseDto.fromEntity(config);
  }

  async updateConfig(
    businessId: string,
    dto: UpdateBusinessConfigDto,
  ): Promise<BusinessConfigResponseDto> {
    const config = await this.getOrCreateDefaultConfig(businessId);

    if (dto.name !== undefined) config.name = dto.name.trim();
    if (dto.logoUrl !== undefined) config.logoUrl = dto.logoUrl?.trim() ?? null;
    if (dto.phone !== undefined) config.phone = dto.phone?.trim() ?? null;
    if (dto.whatsapp !== undefined) config.whatsapp = dto.whatsapp?.trim() ?? null;
    if (dto.email !== undefined) config.email = dto.email?.trim() ?? null;
    if (dto.address !== undefined) config.address = dto.address?.trim() ?? null;
    if (dto.services !== undefined) config.services = dto.services;
    if (dto.coverageAreas !== undefined) config.coverageAreas = dto.coverageAreas;
    if (dto.termsAndConditions !== undefined)
      config.termsAndConditions = dto.termsAndConditions?.trim() ?? null;
    if (dto.description !== undefined) config.description = dto.description?.trim() ?? null;
    if (dto.history !== undefined) config.history = dto.history?.trim() ?? null;
    if (dto.mission !== undefined) config.mission = dto.mission?.trim() ?? null;
    if (dto.vision !== undefined) config.vision = dto.vision?.trim() ?? null;
    if (dto.openingHours !== undefined) config.openingHours = dto.openingHours?.trim() ?? null;
    if (dto.whatsappMessage !== undefined)
      config.whatsappMessage = dto.whatsappMessage?.trim() || null;

    await this.configRepository.save(config);
    const updated = await this.getOrCreateDefaultConfig(businessId);
    return BusinessConfigResponseDto.fromEntity(updated);
  }

  // ── Logo ─────────────────────────────────────────────────────────────────────

  /**
   * Sube el logotipo del negocio al bucket de Supabase Storage y actualiza la URL en BD.
   * Si ya existía un logo previo, elimina el archivo anterior del bucket.
   */
  async uploadLogo(
    businessId: string,
    buffer: Buffer,
    originalName: string,
  ): Promise<BusinessConfigResponseDto> {
    const config = await this.getOrCreateDefaultConfig(businessId);

    // Eliminar logo anterior si existía
    if (config.logoUrl) {
      const oldPath = this.storageService.extractPath(config.logoUrl);
      if (oldPath) await this.storageService.deleteFile(oldPath);
    }

    const { url } = await this.storageService.uploadImage(
      buffer,
      originalName,
      businessId,
      'logo',
    );

    config.logoUrl = url;
    await this.configRepository.save(config);

    const updated = await this.getOrCreateDefaultConfig(businessId);
    return BusinessConfigResponseDto.fromEntity(updated);
  }

  // ── Payment Cards ────────────────────────────────────────────────────────────

  async addPaymentCard(
    businessId: string,
    dto: CreatePaymentCardDto,
  ): Promise<BusinessConfigResponseDto> {
    const config = await this.getOrCreateDefaultConfig(businessId);

    const card = this.cardRepository.create({
      configId: config.id,
      bank: dto.bank.trim(),
      cardNumber: dto.cardNumber?.trim() ?? null,
      clabe: dto.clabe?.trim() ?? null,
      beneficiary: dto.beneficiary.trim(),
    });

    await this.cardRepository.save(card);
    const updated = await this.getOrCreateDefaultConfig(businessId);
    return BusinessConfigResponseDto.fromEntity(updated);
  }

  async updatePaymentCard(
    businessId: string,
    cardId: string,
    dto: UpdatePaymentCardDto,
  ): Promise<BusinessConfigResponseDto> {
    const config = await this.getOrCreateDefaultConfig(businessId);
    const card = await this.cardRepository.findOne({
      where: { id: cardId, configId: config.id },
    });
    if (!card) {
      throw new NotFoundException(
        `No se encontró la cuenta bancaria con ID "${cardId}".`,
      );
    }

    if (dto.bank !== undefined) card.bank = dto.bank.trim();
    if (dto.cardNumber !== undefined) card.cardNumber = dto.cardNumber?.trim() ?? null;
    if (dto.clabe !== undefined) card.clabe = dto.clabe?.trim() ?? null;
    if (dto.beneficiary !== undefined) card.beneficiary = dto.beneficiary.trim();

    await this.cardRepository.save(card);
    const updated = await this.getOrCreateDefaultConfig(businessId);
    return BusinessConfigResponseDto.fromEntity(updated);
  }

  async removePaymentCard(
    businessId: string,
    cardId: string,
  ): Promise<BusinessConfigResponseDto> {
    const config = await this.getOrCreateDefaultConfig(businessId);
    const card = await this.cardRepository.findOne({
      where: { id: cardId, configId: config.id },
    });
    if (!card) {
      throw new NotFoundException(
        `No se encontró la cuenta bancaria con ID "${cardId}".`,
      );
    }

    await this.cardRepository.remove(card);
    const updated = await this.getOrCreateDefaultConfig(businessId);
    return BusinessConfigResponseDto.fromEntity(updated);
  }

  // ── Gallery ──────────────────────────────────────────────────────────────────

  /**
   * Sube una imagen al bucket de Supabase Storage y registra el item en la galería.
   */
  async addGalleryImage(
    businessId: string,
    buffer: Buffer,
    originalName: string,
    dto: UpdateGalleryItemDto,
  ): Promise<BusinessConfigResponseDto> {
    const config = await this.getOrCreateDefaultConfig(businessId);

    const { url } = await this.storageService.uploadImage(
      buffer,
      originalName,
      businessId,
      'gallery',
    );

    const item = this.galleryRepository.create({
      configId: config.id,
      url,
      label: dto.label?.trim() ?? null,
      alt: dto.alt?.trim() ?? null,
      order: dto.order ?? 0,
    });

    await this.galleryRepository.save(item);
    const updated = await this.getOrCreateDefaultConfig(businessId);
    return BusinessConfigResponseDto.fromEntity(updated);
  }

  /**
   * Actualiza los metadatos (label, alt, order) de un item de galería.
   * No modifica la imagen; para eso usa `replaceGalleryImage`.
   */
  async updateGalleryItem(
    businessId: string,
    itemId: string,
    dto: UpdateGalleryItemDto,
  ): Promise<BusinessConfigResponseDto> {
    const item = await this.findGalleryItemOrThrow(businessId, itemId);

    if (dto.label !== undefined) item.label = dto.label.trim() || null;
    if (dto.alt !== undefined) item.alt = dto.alt.trim() || null;
    if (dto.order !== undefined) item.order = dto.order;

    await this.galleryRepository.save(item);
    const updated = await this.getOrCreateDefaultConfig(businessId);
    return BusinessConfigResponseDto.fromEntity(updated);
  }

  /**
   * Elimina un item de galería de la BD y su imagen de Supabase Storage.
   */
  async removeGalleryItem(
    businessId: string,
    itemId: string,
  ): Promise<BusinessConfigResponseDto> {
    const item = await this.findGalleryItemOrThrow(businessId, itemId);

    const oldPath = this.storageService.extractPath(item.url);
    if (oldPath) await this.storageService.deleteFile(oldPath);

    await this.galleryRepository.remove(item);
    const updated = await this.getOrCreateDefaultConfig(businessId);
    return BusinessConfigResponseDto.fromEntity(updated);
  }

  private async findGalleryItemOrThrow(
    businessId: string,
    itemId: string,
  ): Promise<GalleryItem> {
    const config = await this.getOrCreateDefaultConfig(businessId);
    const item = await this.galleryRepository.findOne({
      where: { id: itemId, configId: config.id },
    });
    if (!item) {
      throw new NotFoundException(
        `No se encontró el item de galería con ID "${itemId}".`,
      );
    }
    return item;
  }

  // ── Values ───────────────────────────────────────────────────────────────────

  async addValue(
    businessId: string,
    dto: CreateBusinessValueDto,
  ): Promise<BusinessConfigResponseDto> {
    const config = await this.getOrCreateDefaultConfig(businessId);
    const value = this.valueRepository.create({
      configId: config.id,
      title: dto.title.trim(),
      description: dto.description?.trim() ?? null,
      icon: dto.icon?.trim() ?? null,
      order: dto.order ?? 0,
    });
    await this.valueRepository.save(value);
    const updated = await this.getOrCreateDefaultConfig(businessId);
    return BusinessConfigResponseDto.fromEntity(updated);
  }

  async updateValue(
    businessId: string,
    valueId: string,
    dto: UpdateBusinessValueDto,
  ): Promise<BusinessConfigResponseDto> {
    const value = await this.findValueOrThrow(businessId, valueId);
    if (dto.title !== undefined) value.title = dto.title.trim();
    if (dto.description !== undefined) value.description = dto.description.trim() || null;
    if (dto.icon !== undefined) value.icon = dto.icon.trim() || null;
    if (dto.order !== undefined) value.order = dto.order;
    await this.valueRepository.save(value);
    const updated = await this.getOrCreateDefaultConfig(businessId);
    return BusinessConfigResponseDto.fromEntity(updated);
  }

  async removeValue(
    businessId: string,
    valueId: string,
  ): Promise<BusinessConfigResponseDto> {
    const value = await this.findValueOrThrow(businessId, valueId);
    await this.valueRepository.remove(value);
    const updated = await this.getOrCreateDefaultConfig(businessId);
    return BusinessConfigResponseDto.fromEntity(updated);
  }

  private async findValueOrThrow(businessId: string, valueId: string): Promise<BusinessValue> {
    const config = await this.getOrCreateDefaultConfig(businessId);
    const item = await this.valueRepository.findOne({
      where: { id: valueId, configId: config.id },
    });
    if (!item) throw new NotFoundException(`Valor con ID "${valueId}" no encontrado.`);
    return item;
  }

  // ── Stats ────────────────────────────────────────────────────────────────────

  async addStat(
    businessId: string,
    dto: CreateBusinessStatDto,
  ): Promise<BusinessConfigResponseDto> {
    const config = await this.getOrCreateDefaultConfig(businessId);
    const stat = this.statRepository.create({
      configId: config.id,
      value: dto.value.trim(),
      label: dto.label.trim(),
      order: dto.order ?? 0,
    });
    await this.statRepository.save(stat);
    const updated = await this.getOrCreateDefaultConfig(businessId);
    return BusinessConfigResponseDto.fromEntity(updated);
  }

  async updateStat(
    businessId: string,
    statId: string,
    dto: UpdateBusinessStatDto,
  ): Promise<BusinessConfigResponseDto> {
    const stat = await this.findStatOrThrow(businessId, statId);
    if (dto.value !== undefined) stat.value = dto.value.trim();
    if (dto.label !== undefined) stat.label = dto.label.trim();
    if (dto.order !== undefined) stat.order = dto.order;
    await this.statRepository.save(stat);
    const updated = await this.getOrCreateDefaultConfig(businessId);
    return BusinessConfigResponseDto.fromEntity(updated);
  }

  async removeStat(
    businessId: string,
    statId: string,
  ): Promise<BusinessConfigResponseDto> {
    const stat = await this.findStatOrThrow(businessId, statId);
    await this.statRepository.remove(stat);
    const updated = await this.getOrCreateDefaultConfig(businessId);
    return BusinessConfigResponseDto.fromEntity(updated);
  }

  private async findStatOrThrow(businessId: string, statId: string): Promise<BusinessStat> {
    const config = await this.getOrCreateDefaultConfig(businessId);
    const item = await this.statRepository.findOne({
      where: { id: statId, configId: config.id },
    });
    if (!item) throw new NotFoundException(`Estadística con ID "${statId}" no encontrada.`);
    return item;
  }

  // ── Testimonials ─────────────────────────────────────────────────────────────

  async addTestimonial(
    businessId: string,
    dto: CreateTestimonialDto,
  ): Promise<BusinessConfigResponseDto> {
    const config = await this.getOrCreateDefaultConfig(businessId);
    const testimonial = this.testimonialRepository.create({
      configId: config.id,
      text: dto.text.trim(),
      author: dto.author.trim(),
      rating: dto.rating ?? 5,
      order: dto.order ?? 0,
    });
    await this.testimonialRepository.save(testimonial);
    const updated = await this.getOrCreateDefaultConfig(businessId);
    return BusinessConfigResponseDto.fromEntity(updated);
  }

  async updateTestimonial(
    businessId: string,
    testimonialId: string,
    dto: UpdateTestimonialDto,
  ): Promise<BusinessConfigResponseDto> {
    const testimonial = await this.findTestimonialOrThrow(businessId, testimonialId);
    if (dto.text !== undefined) testimonial.text = dto.text.trim();
    if (dto.author !== undefined) testimonial.author = dto.author.trim();
    if (dto.rating !== undefined) testimonial.rating = dto.rating;
    if (dto.order !== undefined) testimonial.order = dto.order;
    await this.testimonialRepository.save(testimonial);
    const updated = await this.getOrCreateDefaultConfig(businessId);
    return BusinessConfigResponseDto.fromEntity(updated);
  }

  async removeTestimonial(
    businessId: string,
    testimonialId: string,
  ): Promise<BusinessConfigResponseDto> {
    const testimonial = await this.findTestimonialOrThrow(businessId, testimonialId);
    await this.testimonialRepository.remove(testimonial);
    const updated = await this.getOrCreateDefaultConfig(businessId);
    return BusinessConfigResponseDto.fromEntity(updated);
  }

  private async findTestimonialOrThrow(
    businessId: string,
    testimonialId: string,
  ): Promise<Testimonial> {
    const config = await this.getOrCreateDefaultConfig(businessId);
    const item = await this.testimonialRepository.findOne({
      where: { id: testimonialId, configId: config.id },
    });
    if (!item) throw new NotFoundException(`Testimonio con ID "${testimonialId}" no encontrado.`);
    return item;
  }

  // ── FAQs ─────────────────────────────────────────────────────────────────────

  async addFaq(
    businessId: string,
    dto: CreateFaqDto,
  ): Promise<BusinessConfigResponseDto> {
    const config = await this.getOrCreateDefaultConfig(businessId);
    const faq = this.faqRepository.create({
      configId: config.id,
      question: dto.question.trim(),
      answer: dto.answer.trim(),
      order: dto.order ?? 0,
    });
    await this.faqRepository.save(faq);
    const updated = await this.getOrCreateDefaultConfig(businessId);
    return BusinessConfigResponseDto.fromEntity(updated);
  }

  async updateFaq(
    businessId: string,
    faqId: string,
    dto: UpdateFaqDto,
  ): Promise<BusinessConfigResponseDto> {
    const faq = await this.findFaqOrThrow(businessId, faqId);
    if (dto.question !== undefined) faq.question = dto.question.trim();
    if (dto.answer !== undefined) faq.answer = dto.answer.trim();
    if (dto.order !== undefined) faq.order = dto.order;
    await this.faqRepository.save(faq);
    const updated = await this.getOrCreateDefaultConfig(businessId);
    return BusinessConfigResponseDto.fromEntity(updated);
  }

  async removeFaq(
    businessId: string,
    faqId: string,
  ): Promise<BusinessConfigResponseDto> {
    const faq = await this.findFaqOrThrow(businessId, faqId);
    await this.faqRepository.remove(faq);
    const updated = await this.getOrCreateDefaultConfig(businessId);
    return BusinessConfigResponseDto.fromEntity(updated);
  }

  private async findFaqOrThrow(businessId: string, faqId: string): Promise<Faq> {
    const config = await this.getOrCreateDefaultConfig(businessId);
    const item = await this.faqRepository.findOne({
      where: { id: faqId, configId: config.id },
    });
    if (!item) throw new NotFoundException(`FAQ con ID "${faqId}" no encontrada.`);
    return item;
  }

  // ── Helpers privados ─────────────────────────────────────────────────────────

  private async getOrCreateDefaultConfig(businessId: string): Promise<BusinessConfig> {
    let config = await this.configRepository.findOne({
      where: { businessId },
      relations: ['paymentCards', 'gallery', 'values', 'stats', 'testimonials', 'faqs'],
      order: { createdAt: 'ASC' },
    });

    if (!config) {
      const newConfig = this.configRepository.create({
        businessId,
        name: 'Configuración de Negocio',
        phone: '',
        whatsapp: '',
        email: '',
        address: '',
        services: [],
        coverageAreas: [],
        termsAndConditions: '',
      });

      config = await this.configRepository.save(newConfig);

      const found = await this.configRepository.findOne({
        where: { id: config.id, businessId },
        relations: ['paymentCards', 'gallery', 'values', 'stats', 'testimonials', 'faqs'],
      });
      if (found) config = found;
    }

    return config;
  }
}
