import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryAttributeDefinition } from '../../entities/inventory-category.entity';
import { InventoryCategory } from '../../entities/inventory-category.entity';

export class InventoryCategoryResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() color: string;
  @ApiProperty() attributes: CategoryAttributeDefinition[];
  @ApiPropertyOptional() isActive: boolean;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;

  static fromEntity(e: InventoryCategory): InventoryCategoryResponseDto {
    const dto = new InventoryCategoryResponseDto();
    dto.id = e.id;
    dto.name = e.name;
    dto.color = e.color;
    dto.attributes = e.attributes ?? [];
    dto.isActive = e.isActive;
    dto.createdAt = e.createdAt;
    dto.updatedAt = e.updatedAt;
    return dto;
  }
}
