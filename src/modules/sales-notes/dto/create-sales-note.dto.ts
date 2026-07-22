import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { SalesNoteStatus } from '../enums/sales-note-status.enum';
import { CreateSalesNoteItemDto } from './create-sales-note-item.dto';

export class CreateSalesNoteDto {
  @ApiPropertyOptional({
    description: 'Tipo/Estado del comprobante (quote o note).',
    enum: SalesNoteStatus,
    default: SalesNoteStatus.NOTE,
    example: SalesNoteStatus.NOTE,
  })
  @IsOptional()
  @IsEnum(SalesNoteStatus, {
    message: 'status debe ser "quote" o "note".',
  })
  status?: SalesNoteStatus;

  @ApiProperty({
    description: 'Nombre completo del cliente.',
    example: 'Juan Pérez',
  })
  @IsString()
  @IsNotEmpty({ message: 'customerName es requerido.' })
  @MaxLength(150)
  customerName: string;

  @ApiPropertyOptional({
    description: 'Teléfono del cliente.',
    example: '+525512345678',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  customerPhone?: string;

  @ApiPropertyOptional({
    description: 'Dirección del cliente.',
    example: 'Av. Juárez 100, CDMX',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  customerAddress?: string;

  @ApiPropertyOptional({
    description: 'Correo electrónico del cliente.',
    example: 'juan.perez@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'customerEmail debe ser un correo válido.' })
  @MaxLength(150)
  customerEmail?: string;

  @ApiPropertyOptional({
    description: 'Indica si aplica IVA al total.',
    default: false,
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  applyIva?: boolean;

  @ApiPropertyOptional({
    description: 'Tasa de IVA aplicada (ej. 0.16 para 16%).',
    default: 0.16,
    example: 0.16,
  })
  @IsOptional()
  @IsNumber({}, { message: 'ivaRate debe ser un número.' })
  @Min(0, { message: 'ivaRate no puede ser negativo.' })
  @Max(1, { message: 'ivaRate debe ser menor o igual a 1.' })
  ivaRate?: number;

  @ApiPropertyOptional({
    description: 'ID de evento de negocio vinculado (UUID).',
    example: 'e1f1b2c4-1234-4d5e-8f6a-000000000003',
  })
  @IsOptional()
  @IsUUID('4', { message: 'eventId debe ser un UUID válido.' })
  eventId?: string;

  @ApiPropertyOptional({
    description: 'Observaciones o condiciones comerciales.',
    example: 'Válido por 15 días.',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'Lista de ítems/conceptos de la nota de venta.',
    type: [CreateSalesNoteItemDto],
  })
  @ValidateNested({ each: true })
  @Type(() => CreateSalesNoteItemDto)
  @ArrayMinSize(1, { message: 'La nota debe tener al menos 1 ítem.' })
  items: CreateSalesNoteItemDto[];
}
