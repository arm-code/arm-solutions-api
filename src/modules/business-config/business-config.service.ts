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

  async getConfig(): Promise<BusinessConfigResponseDto> {
    const config = await this.getOrCreateDefaultConfig();
    return BusinessConfigResponseDto.fromEntity(config);
  }

  async updateConfig(
    dto: UpdateBusinessConfigDto,
  ): Promise<BusinessConfigResponseDto> {
    const config = await this.getOrCreateDefaultConfig();

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

    await this.configRepository.save(config);
    const updated = await this.getOrCreateDefaultConfig();
    return BusinessConfigResponseDto.fromEntity(updated);
  }

  async addPaymentCard(
    dto: CreatePaymentCardDto,
  ): Promise<BusinessConfigResponseDto> {
    const config = await this.getOrCreateDefaultConfig();

    const card = this.cardRepository.create({
      configId: config.id,
      bank: dto.bank.trim(),
      cardNumber: dto.cardNumber?.trim() ?? null,
      clabe: dto.clabe?.trim() ?? null,
      beneficiary: dto.beneficiary.trim(),
    });

    await this.cardRepository.save(card);
    const updated = await this.getOrCreateDefaultConfig();
    return BusinessConfigResponseDto.fromEntity(updated);
  }

  async removePaymentCard(cardId: string): Promise<BusinessConfigResponseDto> {
    const card = await this.cardRepository.findOne({ where: { id: cardId } });
    if (!card) {
      throw new NotFoundException(
        `No se encontró la cuenta bancaria con ID "${cardId}".`,
      );
    }

    await this.cardRepository.remove(card);
    const updated = await this.getOrCreateDefaultConfig();
    return BusinessConfigResponseDto.fromEntity(updated);
  }

  private async getOrCreateDefaultConfig(): Promise<BusinessConfig> {
    let config = await this.configRepository.findOne({
      where: {},
      relations: ['paymentCards'],
      order: { createdAt: 'ASC' },
    });

    if (!config) {
      const newConfig = this.configRepository.create({
        name: 'Eventos Mendoza',
        phone: '656 123 4567',
        whatsapp: '526561234567',
        email: 'contacto@eventosmendoza.com',
        address: 'Av. Principal #123, Cd. Juárez',
        services: ['Sillas y mesas', 'Carpas', 'Mantelería', 'Montaje'],
        coverageAreas: ['Ciudad Juárez', 'Chihuahua'],
        termsAndConditions:
          'El cliente se compromete a entregar el mobiliario en buen estado.',
      });

      config = await this.configRepository.save(newConfig);

      // Tarjeta inicial por defecto
      const defaultCard = this.cardRepository.create({
        configId: config.id,
        bank: 'BBVA',
        cardNumber: '4152 3138 1234 5678',
        clabe: '012180012345678901',
        beneficiary: 'Eventos Mendoza',
      });
      await this.cardRepository.save(defaultCard);

      config = (await this.configRepository.findOne({
        where: { id: config.id },
        relations: ['paymentCards'],
      }))!;
    }

    return config;
  }
}
