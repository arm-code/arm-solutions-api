import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { CreateSalesNoteItemDto } from './create-sales-note-item.dto';

export class UpdateSalesNoteItemDto extends PartialType(CreateSalesNoteItemDto) {
  @ApiPropertyOptional({
    description: 'ID de un ítem existente si se desea actualizar.',
    example: 'a1b2c3d4-1234-4d5e-8f6a-000000000001',
  })
  @IsOptional()
  @IsUUID('4', { message: 'id del ítem debe ser un UUID válido.' })
  id?: string;
}
