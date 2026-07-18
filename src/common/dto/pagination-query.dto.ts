import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * Query params estándar de paginación, orden y búsqueda.
 * Cualquier endpoint de listado debe extender este DTO.
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Número de página (empieza en 1).',
    default: 1,
    minimum: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page debe ser un número entero.' })
  @Min(1, { message: 'page debe ser mayor o igual a 1.' })
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Cantidad de elementos por página (máximo 100).',
    default: 10,
    minimum: 1,
    maximum: 100,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit debe ser un número entero.' })
  @Min(1, { message: 'limit debe ser mayor o igual a 1.' })
  @Max(100, { message: 'limit no debe ser mayor a 100.' })
  limit: number = 10;

  @ApiPropertyOptional({
    description:
      'Texto libre de búsqueda (aplica a campos indicados por cada módulo).',
    example: 'evento',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Campo por el cual ordenar los resultados.',
    example: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Dirección del orden.',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'], { message: 'sortOrder debe ser ASC o DESC.' })
  sortOrder: 'ASC' | 'DESC' = 'DESC';

  /** Offset calculado a partir de page/limit, listo para usar en la query. */
  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}
