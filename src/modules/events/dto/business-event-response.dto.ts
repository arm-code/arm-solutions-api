import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BusinessEvent } from '../entities/business-event.entity';

export class BusinessEventResponseDto {
  @ApiProperty({ example: 'e1f1b2c4-1234-4d5e-8f6a-000000000003' })
  id: string;

  @ApiProperty({ example: 'EVENTO NEGRO TALIBAN' })
  name: string;

  @ApiPropertyOptional({ example: 'Juan Pérez', nullable: true })
  clientName: string | null;

  @ApiPropertyOptional({ example: '2026-07-17', nullable: true })
  eventDate: string | null;

  @ApiPropertyOptional({
    example: '10 mesas + 80 sillas + brincolín.',
    nullable: true,
  })
  notes: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2026-07-17T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-17T10:00:00.000Z' })
  updatedAt: Date;

  static fromEntity(entity: BusinessEvent): BusinessEventResponseDto {
    const dto = new BusinessEventResponseDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.clientName = entity.clientName;
    dto.eventDate = entity.eventDate;
    dto.notes = entity.notes;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}

export class BusinessEventBalanceResponseDto extends BusinessEventResponseDto {
  @ApiProperty({
    example: 1550,
    description: 'Suma de transacciones INPUT del evento.',
  })
  totalIncome: number;

  @ApiProperty({
    example: 300,
    description: 'Suma de transacciones OUTPUT del evento.',
  })
  totalExpenses: number;

  @ApiProperty({ example: 1250, description: 'totalIncome - totalExpenses.' })
  netBalance: number;
}
