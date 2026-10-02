import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateTestimonialDto {
  @ApiProperty({ description: 'Texto del testimonio.', example: 'Llegaron puntual y el montaje quedó perfecto.' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({ description: 'Nombre del autor/cliente.', example: 'María P.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  author: string;

  @ApiPropertyOptional({ description: 'Calificación del 1 al 5.', example: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ description: 'Posición (0-indexed, ASC).', example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class UpdateTestimonialDto {
  @ApiPropertyOptional({ example: 'Llegaron puntual y el montaje quedó perfecto.' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  text?: string;

  @ApiPropertyOptional({ example: 'María P.' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  author?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
