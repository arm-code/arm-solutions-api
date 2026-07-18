import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateBusinessEventDto } from './create-business-event.dto';

export class UpdateBusinessEventDto extends PartialType(
  CreateBusinessEventDto,
) {
  @ApiPropertyOptional({
    description: 'Si el evento sigue activo.',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
