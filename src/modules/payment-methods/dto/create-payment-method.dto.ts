import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreatePaymentMethodDto {
  @ApiProperty({
    description: 'Código único del método de pago (se guarda en mayúsculas).',
    example: 'CASH',
    maxLength: 30,
  })
  @IsString()
  @IsNotEmpty({ message: 'code es requerido.' })
  @MaxLength(30)
  code: string;

  @ApiProperty({
    description: 'Nombre legible del método de pago.',
    example: 'Efectivo',
  })
  @IsString()
  @IsNotEmpty({ message: 'name es requerido.' })
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Si el método está disponible para usarse.',
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
