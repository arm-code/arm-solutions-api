import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateBusinessEventDto {
  @ApiProperty({
    description: 'Nombre del evento/proyecto.',
    example: 'EVENTO NEGRO TALIBAN',
  })
  @IsString()
  @IsNotEmpty({ message: 'name es requerido.' })
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({
    description: 'Nombre del cliente asociado.',
    example: 'Juan Pérez',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  clientName?: string;

  @ApiPropertyOptional({
    description: 'Fecha del evento (ISO 8601).',
    example: '2026-07-17',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'eventDate debe tener formato de fecha ISO 8601 (YYYY-MM-DD).' },
  )
  eventDate?: string;

  @ApiPropertyOptional({
    description: 'Notas adicionales.',
    example: '10 mesas + 80 sillas + brincolín.',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
