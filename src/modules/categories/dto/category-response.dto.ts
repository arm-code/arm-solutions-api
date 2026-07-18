import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionCategory } from '../entities/transaction-category.entity';

export class CategoryResponseDto {
  @ApiProperty({ example: 'c8f1b2c4-1234-4d5e-8f6a-000000000002' })
  id: string;

  @ApiProperty({ example: 'RENTA' })
  code: string;

  @ApiProperty({ example: 'Renta de mobiliario/equipo' })
  name: string;

  @ApiPropertyOptional({
    example: 'Renta de mesas, sillas, brincolines...',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2026-07-17T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-17T10:00:00.000Z' })
  updatedAt: Date;

  static fromEntity(entity: TransactionCategory): CategoryResponseDto {
    const dto = new CategoryResponseDto();
    dto.id = entity.id;
    dto.code = entity.code;
    dto.name = entity.name;
    dto.description = entity.description;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
