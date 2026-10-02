import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateFaqDto {
  @ApiProperty({ description: 'Pregunta del cliente.', example: '¿Con cuánto tiempo debo reservar?' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({
    description: 'Respuesta del negocio.',
    example: 'Para fines de semana, sugerimos 1–2 semanas antes.',
  })
  @IsString()
  @IsNotEmpty()
  answer: string;

  @ApiPropertyOptional({ description: 'Posición (0-indexed, ASC).', example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class UpdateFaqDto {
  @ApiPropertyOptional({ example: '¿Con cuánto tiempo debo reservar?' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  question?: string;

  @ApiPropertyOptional({ example: 'Para fines de semana, sugerimos 1–2 semanas antes.' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  answer?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
