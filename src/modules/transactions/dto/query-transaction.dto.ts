import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { TransactionType } from '../../../common/enums/transaction-type.enum';

export class QueryTransactionDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filtrar por tipo de movimiento.',
    enum: TransactionType,
  })
  @IsOptional()
  @IsEnum(TransactionType, { message: 'type debe ser INPUT u OUTPUT.' })
  type?: TransactionType;

  @ApiPropertyOptional({
    description: 'Filtrar por categoría.',
    example: 'c8f1b2c4-1234-4d5e-8f6a-000000000002',
  })
  @IsOptional()
  @IsUUID('4')
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por método de pago.',
    example: 'a3f1b2c4-1234-4d5e-8f6a-000000000001',
  })
  @IsOptional()
  @IsUUID('4')
  paymentMethodId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por evento/proyecto.',
    example: 'e1f1b2c4-1234-4d5e-8f6a-000000000003',
  })
  @IsOptional()
  @IsUUID('4')
  businessEventId?: string;

  @ApiPropertyOptional({
    description: 'Fecha inicial del rango (inclusive), ISO 8601.',
    example: '2026-07-01',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Fecha final del rango (inclusive), ISO 8601.',
    example: '2026-07-31',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
