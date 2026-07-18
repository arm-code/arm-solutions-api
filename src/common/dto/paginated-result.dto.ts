import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ example: 1, description: 'Página actual.' })
  page: number;

  @ApiProperty({ example: 10, description: 'Elementos por página.' })
  limit: number;

  @ApiProperty({
    example: 42,
    description: 'Total de elementos que cumplen el filtro.',
  })
  totalItems: number;

  @ApiProperty({ example: 5, description: 'Total de páginas disponibles.' })
  totalPages: number;

  @ApiProperty({
    example: true,
    description: 'Indica si existe una página siguiente.',
  })
  hasNextPage: boolean;

  @ApiProperty({
    example: false,
    description: 'Indica si existe una página previa.',
  })
  hasPreviousPage: boolean;

  constructor(page: number, limit: number, totalItems: number) {
    this.page = page;
    this.limit = limit;
    this.totalItems = totalItems;
    this.totalPages = limit > 0 ? Math.ceil(totalItems / limit) : 0;
    this.hasNextPage = page < this.totalPages;
    this.hasPreviousPage = page > 1;
  }
}

/**
 * Envoltorio genérico para listados paginados.
 * Se coloca dentro de `ApiResponse.data`.
 */
export class PaginatedResultDto<T> {
  @ApiProperty({ isArray: true })
  items: T[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;

  constructor(items: T[], page: number, limit: number, totalItems: number) {
    this.items = items;
    this.meta = new PaginationMetaDto(page, limit, totalItems);
  }
}
