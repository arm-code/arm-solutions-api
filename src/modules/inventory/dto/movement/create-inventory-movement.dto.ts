import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { InventoryMovementType } from '../../enums/inventory-movement-type.enum';

export class CreateInventoryMovementDto {
  @ApiProperty({ example: 'uuid-del-item' })
  @IsUUID()
  itemId: string;

  @ApiProperty({
    enum: InventoryMovementType,
    description:
      'Tipo de movimiento. Quantity es siempre positivo; la dirección la determina el type.',
  })
  @IsEnum(InventoryMovementType)
  type: InventoryMovementType;

  @ApiProperty({
    example: 5,
    description: 'Cantidad a mover. Siempre positivo.',
  })
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  quantity: number;

  @ApiPropertyOptional({ example: 'uuid-ubicacion-origen' })
  @IsOptional()
  @IsUUID()
  originLocationId?: string;

  @ApiPropertyOptional({ example: 'uuid-ubicacion-destino' })
  @IsOptional()
  @IsUUID()
  destinationLocationId?: string;

  @ApiPropertyOptional({ example: 'Compra de equipo nuevo' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
