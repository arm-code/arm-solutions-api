import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryMovement } from '../../entities/inventory-movement.entity';
import type { StockSnapshot } from '../../entities/inventory-movement.entity';
import { InventoryMovementType } from '../../enums/inventory-movement-type.enum';

export class InventoryMovementResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() itemId: string;
  @ApiPropertyOptional() itemName: string | null;
  @ApiProperty({ enum: InventoryMovementType }) type: InventoryMovementType;
  @ApiProperty() quantity: number;
  @ApiPropertyOptional() originLocationId: string | null;
  @ApiPropertyOptional() originLocationName: string | null;
  @ApiPropertyOptional() destinationLocationId: string | null;
  @ApiPropertyOptional() destinationLocationName: string | null;
  @ApiPropertyOptional() reason: string | null;
  @ApiProperty() snapshotStockBefore: StockSnapshot;
  @ApiProperty() snapshotStockAfter: StockSnapshot;
  @ApiProperty() createdAt: Date;

  static fromEntity(e: InventoryMovement): InventoryMovementResponseDto {
    const dto = new InventoryMovementResponseDto();
    dto.id = e.id;
    dto.itemId = e.itemId;
    dto.itemName = e.item?.name ?? null;
    dto.type = e.type;
    dto.quantity = e.quantity;
    dto.originLocationId = e.originLocationId;
    dto.originLocationName = e.originLocation?.name ?? null;
    dto.destinationLocationId = e.destinationLocationId;
    dto.destinationLocationName = e.destinationLocation?.name ?? null;
    dto.reason = e.reason;
    dto.snapshotStockBefore = e.snapshotStockBefore;
    dto.snapshotStockAfter = e.snapshotStockAfter;
    dto.createdAt = e.createdAt;
    return dto;
  }
}
