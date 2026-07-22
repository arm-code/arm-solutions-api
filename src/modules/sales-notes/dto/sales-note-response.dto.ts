import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SalesNoteItem } from '../entities/sales-note-item.entity';
import { SalesNote } from '../entities/sales-note.entity';
import { SalesNoteStatus } from '../enums/sales-note-status.enum';

export class SalesNoteItemResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-1234-4d5e-8f6a-000000000001' })
  id: string;

  @ApiProperty({ example: 'Mesa tablón rectangular 2.40m' })
  concept: string;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 150.0 })
  unitPrice: number;

  @ApiProperty({ example: 300.0 })
  amount: number;

  static fromEntity(entity: SalesNoteItem): SalesNoteItemResponseDto {
    const dto = new SalesNoteItemResponseDto();
    dto.id = entity.id;
    dto.concept = entity.concept;
    dto.quantity = Number(entity.quantity ?? 0);
    dto.unitPrice = Number(entity.unitPrice ?? 0);
    dto.amount = Number(entity.amount ?? 0);
    return dto;
  }
}

export class SalesNoteResponseDto {
  @ApiProperty({ example: 'e1f1b2c4-1234-4d5e-8f6a-000000000003' })
  id: string;

  @ApiProperty({ example: 'NV-0001', description: 'Folio correlativo.' })
  folio: string;

  @ApiProperty({ enum: SalesNoteStatus, example: SalesNoteStatus.NOTE })
  status: SalesNoteStatus;

  @ApiProperty({ example: 'Juan Pérez' })
  customerName: string;

  @ApiPropertyOptional({ example: '+525512345678', nullable: true })
  customerPhone: string | null;

  @ApiPropertyOptional({ example: 'Av. Juárez 100, CDMX', nullable: true })
  customerAddress: string | null;

  @ApiPropertyOptional({ example: 'juan.perez@example.com', nullable: true })
  customerEmail: string | null;

  @ApiProperty({ example: false })
  applyIva: boolean;

  @ApiProperty({ example: 0.16 })
  ivaRate: number;

  @ApiProperty({ example: 300.0 })
  subtotal: number;

  @ApiProperty({ example: 0.0 })
  ivaAmount: number;

  @ApiProperty({ example: 300.0 })
  total: number;

  @ApiPropertyOptional({
    example: 'e1f1b2c4-1234-4d5e-8f6a-000000000003',
    nullable: true,
  })
  eventId: string | null;

  @ApiPropertyOptional({ example: 'Válido por 15 días.', nullable: true })
  notes: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ type: [SalesNoteItemResponseDto] })
  items: SalesNoteItemResponseDto[];

  @ApiProperty({ example: '2026-07-22T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-07-22T10:00:00.000Z' })
  updatedAt: Date;

  static fromEntity(entity: SalesNote): SalesNoteResponseDto {
    const dto = new SalesNoteResponseDto();
    dto.id = entity.id;
    const prefix = entity.status === SalesNoteStatus.QUOTE ? 'COT' : 'NV';
    dto.folio = entity.folio || `${prefix}-${String(entity.folioNumber || 0).padStart(4, '0')}`;
    dto.status = entity.status;
    dto.customerName = entity.customerName;
    dto.customerPhone = entity.customerPhone;
    dto.customerAddress = entity.customerAddress;
    dto.customerEmail = entity.customerEmail;
    dto.applyIva = entity.applyIva;
    dto.ivaRate = Number(entity.ivaRate ?? 0.16);
    dto.subtotal = Number(entity.subtotal ?? 0);
    dto.ivaAmount = Number(entity.ivaAmount ?? 0);
    dto.total = Number(entity.total ?? 0);
    dto.eventId = entity.eventId;
    dto.notes = entity.notes;
    dto.isActive = entity.isActive;
    dto.items = (entity.items || []).map((item) =>
      SalesNoteItemResponseDto.fromEntity(item),
    );
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}
