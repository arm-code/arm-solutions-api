import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BusinessEvent } from '../entities/business-event.entity';
import { EventStatus } from '../enums/event-status.enum';

export class BusinessEventResponseDto {
  @ApiProperty({ example: 'e1f1b2c4-1234-4d5e-8f6a-000000000003' })
  id: string;

  @ApiProperty({ example: 'EV-0001', description: 'Folio correlativo.' })
  folio: string;

  @ApiProperty({ example: 'Renta Mobiliario Cumpleaños' })
  name: string;

  @ApiPropertyOptional({ example: 'Juan Pérez', nullable: true })
  clientName: string | null;

  @ApiPropertyOptional({ example: '+525512345678', nullable: true })
  clientPhone: string | null;

  @ApiPropertyOptional({
    example: 'Av. Insurgentes Sur 123, CDMX',
    nullable: true,
  })
  eventAddress: string | null;

  @ApiPropertyOptional({ example: '2026-07-17T15:00:00.000Z', nullable: true })
  eventDate: string | null;

  @ApiProperty({ example: 1500, description: 'Costo total del servicio.' })
  cost: number;

  @ApiProperty({
    enum: EventStatus,
    example: EventStatus.PENDING,
    description: 'Estado actual del evento.',
  })
  status: EventStatus;

  @ApiPropertyOptional({
    example: 'INE / Credencial de Elector',
    nullable: true,
  })
  guaranteeDocument: string | null;

  @ApiPropertyOptional({
    example: 'e1f1b2c4-1234-4d5e-8f6a-000000000003',
    nullable: true,
  })
  noteId: string | null;

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
    dto.folio = entity.folio || `EV-${String(entity.folioNumber || 0).padStart(4, '0')}`;
    dto.name = entity.name;
    dto.clientName = entity.clientName;
    dto.clientPhone = entity.clientPhone;
    dto.eventAddress = entity.eventAddress;
    dto.eventDate = entity.eventDate;
    dto.cost = Number(entity.cost ?? 0);
    dto.status = entity.status;
    dto.guaranteeDocument = entity.guaranteeDocument;
    dto.noteId = entity.noteId;
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
