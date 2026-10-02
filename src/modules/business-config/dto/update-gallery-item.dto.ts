import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

/** DTO para actualizar los metadatos de un item de galería (sin imagen). */
export class UpdateGalleryItemDto {
  @ApiPropertyOptional({
    description: 'Etiqueta legible de la imagen.',
    example: 'Mesas y sillas',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  label?: string;

  @ApiPropertyOptional({
    description: 'Texto alternativo accesible para la imagen.',
    example: 'Fotografía de mesas y sillas estilo clásico',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  alt?: string;

  @ApiPropertyOptional({
    description: 'Posición en el carrusel (0-indexed, ASC).',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
