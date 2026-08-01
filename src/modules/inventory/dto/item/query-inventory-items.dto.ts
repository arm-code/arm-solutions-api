import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import { InventoryItemStatus } from '../../enums/inventory-item-status.enum';
import { InventoryItemType } from '../../enums/inventory-item-type.enum';

export class QueryInventoryItemsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'uuid-de-la-categoria' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ enum: InventoryItemStatus })
  @IsOptional()
  @IsEnum(InventoryItemStatus)
  status?: InventoryItemStatus;

  @ApiPropertyOptional({ enum: InventoryItemType })
  @IsOptional()
  @IsEnum(InventoryItemType)
  type?: InventoryItemType;

  /** Filtra también ítems inactivos (soft-deleted) cuando `false`. Por defecto solo activos. */
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean = true;
}
