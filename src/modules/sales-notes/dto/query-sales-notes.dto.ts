import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { SalesNoteStatus } from '../enums/sales-note-status.enum';

export class QuerySalesNotesDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filtrar por tipo/estado (quote o note).',
    enum: SalesNoteStatus,
    example: SalesNoteStatus.NOTE,
  })
  @IsOptional()
  @IsEnum(SalesNoteStatus, {
    message: 'status debe ser "quote" o "note".',
  })
  status?: SalesNoteStatus;

  @ApiPropertyOptional({
    description: 'Filtrar por ID de evento vinculado (UUID).',
    example: 'e1f1b2c4-1234-4d5e-8f6a-000000000003',
  })
  @IsOptional()
  @IsUUID('4', { message: 'eventId debe ser un UUID válido.' })
  eventId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por estado activo.',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
