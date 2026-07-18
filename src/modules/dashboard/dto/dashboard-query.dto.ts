import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class DashboardQueryDto {
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
