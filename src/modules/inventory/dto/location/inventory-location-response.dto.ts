import { ApiProperty } from '@nestjs/swagger';
import { InventoryLocation } from '../../entities/inventory-location.entity';
import { InventoryLocationType } from '../../enums/inventory-location-type.enum';

export class InventoryLocationResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ enum: InventoryLocationType }) type: InventoryLocationType;
  @ApiProperty() isActive: boolean;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;

  static fromEntity(e: InventoryLocation): InventoryLocationResponseDto {
    const dto = new InventoryLocationResponseDto();
    dto.id = e.id;
    dto.name = e.name;
    dto.type = e.type;
    dto.isActive = e.isActive;
    dto.createdAt = e.createdAt;
    dto.updatedAt = e.updatedAt;
    return dto;
  }
}
