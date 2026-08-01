import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { InventoryItemStatus } from '../../enums/inventory-item-status.enum';
import { InventoryItemType } from '../../enums/inventory-item-type.enum';

export class CreateInventoryItemDto {
  @ApiProperty({ example: 'Micrófono Shure SM58' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({ example: 'MIC-SM58-001', description: 'Único por negocio (ownerId).' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sku: string;

  @ApiProperty({ enum: InventoryItemType })
  @IsEnum(InventoryItemType)
  type: InventoryItemType;

  @ApiProperty({ example: 'uuid-de-la-categoria' })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ enum: InventoryItemStatus, default: InventoryItemStatus.AVAILABLE })
  @IsOptional()
  @IsEnum(InventoryItemStatus)
  status?: InventoryItemStatus;

  @ApiPropertyOptional({ example: 'uuid-de-la-ubicacion' })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional({ example: 350.00, description: 'Precio de renta por unidad.' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  rentPrice?: number;

  @ApiPropertyOptional({ example: 4500.00, description: 'Precio de venta.' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Type(() => Number)
  salePrice?: number;

  @ApiPropertyOptional({
    example: { color: 'negro', material: 'aluminio' },
    description: 'Atributos dinámicos según la categoría.',
  })
  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;
}
