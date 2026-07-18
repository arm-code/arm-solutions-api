import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Código único de la categoría (se guarda en mayúsculas).',
    example: 'RENTA',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: 'code es requerido.' })
  @MaxLength(50)
  code: string;

  @ApiProperty({
    description: 'Nombre legible de la categoría.',
    example: 'Renta de mobiliario/equipo',
  })
  @IsString()
  @IsNotEmpty({ message: 'name es requerido.' })
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Descripción opcional.',
    example: 'Renta de mesas, sillas, brincolines...',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({
    description: 'Si la categoría está disponible para usarse.',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
