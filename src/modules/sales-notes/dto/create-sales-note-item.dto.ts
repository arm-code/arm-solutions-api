import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, MaxLength, Min } from 'class-validator';

export class CreateSalesNoteItemDto {
  @ApiProperty({
    description: 'Nombre o descripción del producto/servicio.',
    example: 'Mesa tablón rectangular 2.40m',
  })
  @IsString()
  @IsNotEmpty({ message: 'concept es requerido.' })
  @MaxLength(255)
  concept: string;

  @ApiProperty({
    description: 'Cantidad de artículos o días.',
    example: 2,
    minimum: 1,
  })
  @IsNumber({}, { message: 'quantity debe ser un número.' })
  @Min(1, { message: 'quantity debe ser mayor o igual a 1.' })
  quantity: number;

  @ApiProperty({
    description: 'Precio unitario.',
    example: 150.0,
    minimum: 0,
  })
  @IsNumber({}, { message: 'unitPrice debe ser un número.' })
  @Min(0, { message: 'unitPrice debe ser mayor o igual a 0.' })
  unitPrice: number;
}
