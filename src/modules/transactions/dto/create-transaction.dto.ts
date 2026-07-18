import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { TransactionType } from '../../../common/enums/transaction-type.enum';

export class CreateTransactionDto {
  @ApiProperty({
    description: 'Fecha del movimiento (ISO 8601, YYYY-MM-DD).',
    example: '2026-07-17',
  })
  @IsDateString(
    {},
    {
      message:
        'transactionDate debe tener formato de fecha ISO 8601 (YYYY-MM-DD).',
    },
  )
  transactionDate: string;

  @ApiProperty({
    description: 'Tipo de movimiento.',
    enum: TransactionType,
    example: TransactionType.INPUT,
  })
  @IsEnum(TransactionType, { message: 'type debe ser INPUT u OUTPUT.' })
  type: TransactionType;

  @ApiPropertyOptional({
    description: 'Descripción/concepto del movimiento.',
    example: '10 MESAS G + 80 SILLAS + BRINCA B',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiProperty({
    description: 'Monto del movimiento. Debe ser mayor a 0.',
    example: 1550,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'amount debe ser un número con máximo 2 decimales.' },
  )
  @IsPositive({ message: 'amount debe ser mayor a 0.' })
  amount: number;

  @ApiProperty({
    description: 'Id de la categoría del movimiento.',
    example: 'c8f1b2c4-1234-4d5e-8f6a-000000000002',
  })
  @IsUUID('4', { message: 'categoryId debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'categoryId es requerido.' })
  categoryId: string;

  @ApiProperty({
    description: 'Id del método de pago.',
    example: 'a3f1b2c4-1234-4d5e-8f6a-000000000001',
  })
  @IsUUID('4', { message: 'paymentMethodId debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'paymentMethodId es requerido.' })
  paymentMethodId: string;

  @ApiPropertyOptional({
    description:
      'Id del evento/proyecto asociado (opcional, para gastos generales del negocio).',
    example: 'e1f1b2c4-1234-4d5e-8f6a-000000000003',
  })
  @IsOptional()
  @IsUUID('4', { message: 'businessEventId debe ser un UUID válido.' })
  businessEventId?: string;
}
