import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { EventStatus } from '../enums/event-status.enum';

export type EventTabType = 'upcoming' | 'finished' | 'cancelled' | 'all';

export class QueryBusinessEventDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filtrar por estado del evento.',
    enum: EventStatus,
    example: EventStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(EventStatus, {
    message:
      'status debe ser uno de los siguientes valores: pending, delivered, collected, cancelled',
  })
  status?: EventStatus;

  @ApiPropertyOptional({
    description:
      'Filtrar por pestaña: "upcoming" (pending y delivered), "finished" (collected), "cancelled", "all".',
    enum: ['upcoming', 'finished', 'cancelled', 'all'],
    example: 'upcoming',
  })
  @IsOptional()
  @IsIn(['upcoming', 'finished', 'cancelled', 'all'], {
    message: 'tab debe ser uno de: upcoming, finished, cancelled, all',
  })
  tab?: EventTabType;

  @ApiPropertyOptional({
    description: 'Filtrar por estado activo/inactivo.',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
