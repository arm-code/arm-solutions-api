import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength, Matches } from 'class-validator';

export class CreateBusinessDto {
  @ApiProperty({ example: 'Eventos Mendoza', description: 'Nombre del negocio.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({
    example: 'eventos-mendoza',
    description:
      'Slug URL-amigable. Solo letras minúsculas, números y guiones. ' +
      'Se genera automáticamente a partir del nombre si no se envía.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'El slug solo puede contener letras minúsculas, números y guiones.',
  })
  slug?: string;
}
