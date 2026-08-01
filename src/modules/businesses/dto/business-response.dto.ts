import { ApiProperty } from '@nestjs/swagger';
import { BusinessRole } from '../enums/business-role.enum';
import { Business } from '../entities/business.entity';
import { BusinessUser } from '../entities/business-user.entity';

export class BusinessResponseDto {
  @ApiProperty({ example: 'f1a1b2c4-1234-4d5e-8f6a-000000000001' })
  id: string;

  @ApiProperty({ example: 'Eventos Mendoza' })
  name: string;

  @ApiProperty({ example: 'eventos-mendoza' })
  slug: string;

  @ApiProperty({ example: 'https://cdn.example.com/logo.png', nullable: true })
  logoUrl: string | null;

  @ApiProperty({ enum: BusinessRole, example: BusinessRole.ADMIN })
  role: BusinessRole;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntities(business: Business, membership: BusinessUser): BusinessResponseDto {
    const dto = new BusinessResponseDto();
    dto.id = business.id;
    dto.name = business.name;
    dto.slug = business.slug;
    dto.logoUrl = business.logoUrl;
    dto.role = membership.role;
    dto.createdAt = business.createdAt;
    dto.updatedAt = business.updatedAt;
    return dto;
  }
}
