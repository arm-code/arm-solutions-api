import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '../../../common/enums/transaction-type.enum';
import { Transaction } from '../entities/transaction.entity';

class RelatedCatalogItemDto {
  @ApiProperty({ example: 'c8f1b2c4-1234-4d5e-8f6a-000000000002' })
  id: string;

  @ApiProperty({ example: 'RENTA' })
  code: string;

  @ApiProperty({ example: 'Renta de mobiliario/equipo' })
  name: string;
}

class RelatedEventDto {
  @ApiProperty({ example: 'e1f1b2c4-1234-4d5e-8f6a-000000000003' })
  id: string;

  @ApiProperty({ example: 'EVENTO NEGRO TALIBAN' })
  name: string;
}

export class TransactionResponseDto {
  @ApiProperty({ example: 'f1a1b2c4-1234-4d5e-8f6a-000000000004' })
  id: string;

  @ApiProperty({
    example: 'FOL-0001',
    description:
      'Folio consecutivo legible, calculado a partir de folioNumber.',
  })
  folio: string;

  @ApiProperty({ example: '2026-07-17' })
  transactionDate: string;

  @ApiProperty({ enum: TransactionType, example: TransactionType.INPUT })
  type: TransactionType;

  @ApiPropertyOptional({
    example: '10 MESAS G + 80 SILLAS + BRINCA B',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({ example: 1550, description: 'Monto del movimiento.' })
  amount: number;

  @ApiProperty({ type: RelatedCatalogItemDto })
  category: RelatedCatalogItemDto;

  @ApiProperty({ type: RelatedCatalogItemDto })
  paymentMethod: RelatedCatalogItemDto;

  @ApiPropertyOptional({ type: RelatedEventDto, nullable: true })
  businessEvent: RelatedEventDto | null;

  @ApiProperty({ example: '2026-07-17T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-17T10:00:00.000Z' })
  updatedAt: Date;

  static fromEntity(entity: Transaction): TransactionResponseDto {
    const dto = new TransactionResponseDto();
    dto.id = entity.id;
    dto.folio = entity.folio;
    dto.transactionDate = entity.transactionDate;
    dto.type = entity.type;
    dto.description = entity.description;
    dto.amount = Number(entity.amount);
    dto.category = {
      id: entity.category.id,
      code: entity.category.code,
      name: entity.category.name,
    };
    dto.paymentMethod = {
      id: entity.paymentMethod.id,
      code: entity.paymentMethod.code,
      name: entity.paymentMethod.name,
    };
    dto.businessEvent = entity.businessEvent
      ? { id: entity.businessEvent.id, name: entity.businessEvent.name }
      : null;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
