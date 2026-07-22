import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { EventStatus } from '../enums/event-status.enum';

export class UpdateEventStatusDto {
  @ApiProperty({
    description: 'Nuevo estado del evento.',
    enum: EventStatus,
    example: EventStatus.DELIVERED,
  })
  @IsNotEmpty({ message: 'status es requerido.' })
  @IsEnum(EventStatus, {
    message:
      'status debe ser uno de los siguientes valores: pending, delivered, collected, cancelled',
  })
  status: EventStatus;
}
