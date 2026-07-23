import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePaymentCardDto {
  @ApiProperty({
    description: 'Nombre de la institución bancaria.',
    example: 'BBVA',
  })
  @IsString()
  @IsNotEmpty({ message: 'bank es requerido.' })
  @MaxLength(100)
  bank: string;

  @ApiPropertyOptional({
    description: 'Número de tarjeta (16 dígitos).',
    example: '4152 3138 1234 5678',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  cardNumber?: string;

  @ApiPropertyOptional({
    description: 'CLABE interbancaria (18 dígitos).',
    example: '012180012345678901',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  clabe?: string;

  @ApiProperty({
    description: 'Nombre completo del titular de la cuenta.',
    example: 'Eventos Mendoza',
  })
  @IsString()
  @IsNotEmpty({ message: 'beneficiary es requerido.' })
  @MaxLength(150)
  beneficiary: string;
}
