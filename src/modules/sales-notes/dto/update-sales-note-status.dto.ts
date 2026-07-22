import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { SalesNoteStatus } from '../enums/sales-note-status.enum';

export class UpdateSalesNoteStatusDto {
  @ApiProperty({
    description: 'Nuevo estado o tipo del comprobante (quote o note).',
    enum: SalesNoteStatus,
    example: SalesNoteStatus.NOTE,
  })
  @IsNotEmpty({ message: 'status es requerido.' })
  @IsEnum(SalesNoteStatus, {
    message: 'status debe ser "quote" o "note".',
  })
  status: SalesNoteStatus;
}
