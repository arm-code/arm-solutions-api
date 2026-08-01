import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AttributeDefinitionDto {
  @ApiProperty({ example: 'color' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: ['string', 'number', 'boolean', 'date'] })
  @IsIn(['string', 'number', 'boolean', 'date'])
  type: 'string' | 'number' | 'boolean' | 'date';

  @ApiProperty({ example: true })
  @IsBoolean()
  required: boolean;
}

export class CreateInventoryCategoryDto {
  @ApiProperty({ example: 'Audio' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: '#7c3aed', description: 'Color hex o CSS name.' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  color?: string;

  @ApiPropertyOptional({
    type: [AttributeDefinitionDto],
    description: 'Atributos dinámicos de la categoría.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeDefinitionDto)
  attributes?: AttributeDefinitionDto[];
}
