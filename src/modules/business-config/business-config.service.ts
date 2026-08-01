import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessConfigResponseDto } from './dto/business-config-response.dto';
import { CreatePaymentCardDto } from './dto/create-payment-card.dto';
import { UpdateBusinessConfigDto } from './dto/update-business-config.dto';
import { BusinessConfig } from './entities/business-config.entity';
import { PaymentCard } from './entities/payment-card.entity';

@Injectable()
export class BusinessConfigService {
  constructor(
    @InjectRepository(BusinessConfig)
    private readonly configRepository: Repository<BusinessConfig>,
    @InjectRepository(PaymentCard)
    private readonly cardRepository: Repository<PaymentCard>,
  ) {}

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

    await this.configRepository.save(config);
    const updated = await this.getOrCreateDefaultConfig(businessId);
    return BusinessConfigResponseDto.fromEntity(updated);
  }

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

  private async getOrCreateDefaultConfig(businessId: string): Promise<BusinessConfig> {
    let config = await this.configRepository.findOne({
      where: { businessId },
      relations: ['paymentCards'],
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
        relations: ['paymentCards'],
      });
      if (found) config = found;
    }

    return config;
  }
}
