import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { EventStatus } from '../enums/event-status.enum';

export class CreateBusinessEventDto {
  @ApiProperty({
    description: 'Nombre del evento o servicio prestado.',
    example: 'Renta Mobiliario Cumpleaños',
  })
  @IsString()
  @IsNotEmpty({ message: 'name es requerido.' })
  @MaxLength(150)
  name: string;

  @ApiProperty({
    description: 'Fecha y hora programada para el evento (ISO 8601).',
    example: '2026-07-17T15:00:00.000Z',
  })
  @IsNotEmpty({ message: 'eventDate es requerido.' })
  @IsDateString(
    {},
    { message: 'eventDate debe tener formato de fecha ISO 8601.' },
  )
  eventDate: string;

  @ApiProperty({
    description: 'Nombre completo del cliente o empresa.',
    example: 'Juan Pérez',
  })
  @IsString()
  @IsNotEmpty({ message: 'clientName es requerido.' })
  @MaxLength(150)
  clientName: string;

  @ApiPropertyOptional({
    description: 'Teléfono de contacto del cliente.',
    example: '+525512345678',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  clientPhone?: string;

  @ApiProperty({
    description: 'Dirección de entrega u ubicación del evento.',
    example: 'Av. Insurgentes Sur 123, CDMX',
  })
  @IsString()
  @IsNotEmpty({ message: 'eventAddress es requerido.' })
  @MaxLength(255)
  eventAddress: string;

  @ApiProperty({
    description: 'Costo total del servicio (mayor o igual a 0).',
    example: 1500,
  })
  @IsNumber({}, { message: 'cost debe ser un número.' })
  @Min(0, { message: 'cost debe ser mayor o igual a 0.' })
  cost: number;

  @ApiPropertyOptional({
    description: 'Estado inicial del evento.',
    enum: EventStatus,
    default: EventStatus.PENDING,
    example: EventStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(EventStatus, {
    message:
      'status debe ser uno de los siguientes valores: pending, delivered, collected, cancelled',
  })
  status?: EventStatus;

  @ApiPropertyOptional({
    description: 'Documento o depósito de garantía dejado por el cliente.',
    example: 'INE / Credencial de Elector',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  guaranteeDocument?: string;

  @ApiPropertyOptional({
    description: 'ID (UUID) de la Nota de Venta vinculada.',
    example: 'e1f1b2c4-1234-4d5e-8f6a-000000000003',
  })
  @IsOptional()
  @IsUUID('4', { message: 'noteId debe ser un UUID válido.' })
  noteId?: string;

  @ApiPropertyOptional({
    description: 'Observaciones o instrucciones de entrega/recolección.',
    example: 'Entregar a las 10:00 AM. Recoger al día siguiente.',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
