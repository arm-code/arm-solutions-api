import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../entities/payment-method.entity';

export class PaymentMethodResponseDto {
  @ApiProperty({ example: 'a3f1b2c4-1234-4d5e-8f6a-000000000001' })
  id: string;

  @ApiProperty({ example: 'CASH' })
  code: string;

  @ApiProperty({ example: 'Efectivo' })
  name: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2026-07-17T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-17T10:00:00.000Z' })
  updatedAt: Date;

  static fromEntity(entity: PaymentMethod): PaymentMethodResponseDto {
    const dto = new PaymentMethodResponseDto();
    dto.id = entity.id;
    dto.code = entity.code;
    dto.name = entity.name;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
