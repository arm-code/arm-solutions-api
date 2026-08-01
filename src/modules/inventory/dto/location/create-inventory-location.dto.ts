import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { InventoryLocationType } from '../../enums/inventory-location-type.enum';

export class CreateInventoryLocationDto {
  @ApiProperty({ example: 'Bodega Central' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ enum: InventoryLocationType })
  @IsEnum(InventoryLocationType)
  type: InventoryLocationType;
}
