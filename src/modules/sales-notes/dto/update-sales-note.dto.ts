import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { CreateSalesNoteDto } from './create-sales-note.dto';
import { UpdateSalesNoteItemDto } from './update-sales-note-item.dto';

export class UpdateSalesNoteDto extends PartialType(
  OmitType(CreateSalesNoteDto, ['items'] as const),
) {
  @ApiPropertyOptional({
    description: 'Estado activo de la nota.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Lista de ítems para actualizar o reemplazar.',
    type: [UpdateSalesNoteItemDto],
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => UpdateSalesNoteItemDto)
  items?: UpdateSalesNoteItemDto[];
}
