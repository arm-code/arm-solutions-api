import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/dto/pagination-query.dto';
import { InventoryMovementType } from '../../enums/inventory-movement-type.enum';

export class QueryInventoryMovementsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'uuid-del-item' })
  @IsOptional()
  @IsUUID()
  itemId?: string;

  @ApiPropertyOptional({ enum: InventoryMovementType })
  @IsOptional()
  @IsEnum(InventoryMovementType)
  type?: InventoryMovementType;

  @ApiPropertyOptional({ example: '2026-01-01', description: 'Filtro de fecha inicio (ISO 8601).' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31', description: 'Filtro de fecha fin (ISO 8601).' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
