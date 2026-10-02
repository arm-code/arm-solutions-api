import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBusinessStatDto {
  @ApiProperty({
    description: 'Valor de la métrica (string libre, puede incluir +, %, etc.).',
    example: '+500',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  value: string;

  @ApiProperty({ description: 'Descripción de la métrica.', example: 'eventos atendidos' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  label: string;

  @ApiPropertyOptional({ description: 'Posición (0-indexed, ASC).', example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class UpdateBusinessStatDto {
  @ApiPropertyOptional({ example: '+500' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  value?: string;

  @ApiPropertyOptional({ example: 'eventos atendidos' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  label?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
