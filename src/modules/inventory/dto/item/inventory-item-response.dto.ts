import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryItem } from '../../entities/inventory-item.entity';
import { InventoryItemSerial } from '../../entities/inventory-item-serial.entity';
import { InventoryItemStatus } from '../../enums/inventory-item-status.enum';
import { InventoryItemType } from '../../enums/inventory-item-type.enum';

export class StockDto {
  @ApiProperty() total: number;
  @ApiProperty() available: number;
  @ApiProperty() reserved: number;
  @ApiProperty() rented: number;
}

export class InventoryItemSerialResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() serialNumber: string;
  @ApiProperty({ enum: InventoryItemStatus }) status: InventoryItemStatus;
  @ApiPropertyOptional() notes: string | null;
  @ApiProperty() createdAt: Date;

  static fromEntity(e: InventoryItemSerial): InventoryItemSerialResponseDto {
    const dto = new InventoryItemSerialResponseDto();
    dto.id = e.id;
    dto.serialNumber = e.serialNumber;
    dto.status = e.status;
    dto.notes = e.notes;
    dto.createdAt = e.createdAt;
    return dto;
  }
}

export class InventoryItemResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() sku: string;
  @ApiProperty({ enum: InventoryItemType }) type: InventoryItemType;
  @ApiProperty({ enum: InventoryItemStatus }) status: InventoryItemStatus;
  @ApiProperty() categoryId: string;
  @ApiPropertyOptional() categoryName: string | null;
  @ApiPropertyOptional() locationId: string | null;
  @ApiPropertyOptional() locationName: string | null;
  @ApiPropertyOptional() rentPrice: number | null;
  @ApiPropertyOptional() salePrice: number | null;
  @ApiProperty({ type: StockDto }) stock: StockDto;
  @ApiProperty() attributes: Record<string, unknown>;
  @ApiProperty() isActive: boolean;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;

  /** Solo presente cuando `type === 'serialized'` y se llama el endpoint de detalle. */
  @ApiPropertyOptional({ type: [InventoryItemSerialResponseDto] })
  serials?: InventoryItemSerialResponseDto[];

  static fromEntity(e: InventoryItem, includeSerials = false): InventoryItemResponseDto {
    const dto = new InventoryItemResponseDto();
    dto.id = e.id;
    dto.name = e.name;
    dto.sku = e.sku;
    dto.type = e.type;
    dto.status = e.status;
    dto.categoryId = e.categoryId;
    dto.categoryName = e.category?.name ?? null;
    dto.locationId = e.locationId;
    dto.locationName = e.location?.name ?? null;
    dto.rentPrice = e.rentPrice != null ? Number(e.rentPrice) : null;
    dto.salePrice = e.salePrice != null ? Number(e.salePrice) : null;
    dto.stock = {
      total: e.stockTotal,
      available: e.stockAvailable,
      reserved: e.stockReserved,
      rented: e.stockRented,
    };
    dto.attributes = e.attributes ?? {};
    dto.isActive = e.isActive;
    dto.createdAt = e.createdAt;
    dto.updatedAt = e.updatedAt;

    if (includeSerials && e.serials) {
      dto.serials = e.serials.map(InventoryItemSerialResponseDto.fromEntity);
    }

    return dto;
  }
}
