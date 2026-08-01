import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BusinessConfigResponseDto } from '../../business-config/dto/business-config-response.dto';
import { Business } from '../entities/business.entity';

export class PublicBusinessResponseDto {
  @ApiProperty({ example: 'f1a1b2c4-1234-4d5e-8f6a-000000000001' })
  id: string;

  @ApiProperty({ example: 'Eventos Mendoza' })
  name: string;

  @ApiProperty({ example: 'eventos-mendoza' })
  slug: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/logo.png', nullable: true })
  logoUrl: string | null;

  @ApiProperty({ type: BusinessConfigResponseDto })
  config: BusinessConfigResponseDto;

  static create(business: Business, configDto: BusinessConfigResponseDto): PublicBusinessResponseDto {
    const dto = new PublicBusinessResponseDto();
    dto.id = business.id;
    dto.name = business.name;
    dto.slug = business.slug;
    dto.logoUrl = business.logoUrl;
    dto.config = configDto;
    return dto;
  }
}
