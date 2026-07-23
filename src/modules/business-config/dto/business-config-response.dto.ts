import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BusinessConfig } from '../entities/business-config.entity';
import { PaymentCard } from '../entities/payment-card.entity';

export class PaymentCardResponseDto {
  @ApiProperty({ example: 'card-001' })
  id: string;

  @ApiProperty({ example: 'BBVA' })
  bank: string;

  @ApiPropertyOptional({ example: '4152 3138 1234 5678', nullable: true })
  cardNumber: string | null;

  @ApiPropertyOptional({ example: '012180012345678901', nullable: true })
  clabe: string | null;

  @ApiProperty({ example: 'Eventos Mendoza' })
  beneficiary: string;

  static fromEntity(entity: PaymentCard): PaymentCardResponseDto {
    const dto = new PaymentCardResponseDto();
    dto.id = entity.id;
    dto.bank = entity.bank;
    dto.cardNumber = entity.cardNumber;
    dto.clabe = entity.clabe;
    dto.beneficiary = entity.beneficiary;
    return dto;
  }
}

export class BusinessConfigResponseDto {
  @ApiProperty({ example: 'cfg-123456' })
  id: string;

  @ApiProperty({ example: 'Eventos Mendoza' })
  name: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png', nullable: true })
  logoUrl: string | null;

  @ApiPropertyOptional({ example: '656 123 4567', nullable: true })
  phone: string | null;

  @ApiPropertyOptional({ example: '526561234567', nullable: true })
  whatsapp: string | null;

  @ApiPropertyOptional({ example: 'contacto@eventosmendoza.com', nullable: true })
  email: string | null;

  @ApiPropertyOptional({ example: 'Av. Principal #123, Cd. Juárez', nullable: true })
  address: string | null;

  @ApiProperty({ example: ['Sillas y mesas', 'Carpas', 'Mantelería', 'Montaje'] })
  services: string[];

  @ApiProperty({ example: ['Ciudad Juárez', 'Chihuahua'] })
  coverageAreas: string[];

  @ApiPropertyOptional({
    example: 'El cliente se compromete a entregar el mobiliario en buen estado.',
    nullable: true,
  })
  termsAndConditions: string | null;

  @ApiProperty({ type: [PaymentCardResponseDto] })
  paymentCards: PaymentCardResponseDto[];

  @ApiProperty({ example: '2026-07-23T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-23T10:00:00.000Z' })
  updatedAt: Date;

  static fromEntity(entity: BusinessConfig): BusinessConfigResponseDto {
    const dto = new BusinessConfigResponseDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.logoUrl = entity.logoUrl;
    dto.phone = entity.phone;
    dto.whatsapp = entity.whatsapp;
    dto.email = entity.email;
    dto.address = entity.address;
    dto.services = entity.services || [];
    dto.coverageAreas = entity.coverageAreas || [];
    dto.termsAndConditions = entity.termsAndConditions;
    dto.paymentCards = (entity.paymentCards || []).map((card) =>
      PaymentCardResponseDto.fromEntity(card),
    );
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
