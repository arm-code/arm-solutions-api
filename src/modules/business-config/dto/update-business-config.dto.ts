import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateBusinessConfigDto {
  @ApiPropertyOptional({
    description: 'Nombre comercial o razón social de la empresa.',
    example: 'Eventos Mendoza',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({
    description: 'URL del logotipo oficial.',
    example: 'https://example.com/logo.png',
  })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({
    description: 'Teléfono oficial de contacto.',
    example: '656 123 4567',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Número de WhatsApp.',
    example: '526561234567',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  whatsapp?: string;

  @ApiPropertyOptional({
    description: 'Correo electrónico institucional.',
    example: 'contacto@eventosmendoza.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'email debe ser un correo válido.' })
  @MaxLength(150)
  email?: string;

  @ApiPropertyOptional({
    description: 'Dirección física de la bodega u oficina.',
    example: 'Av. Principal #123, Cd. Juárez',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({
    description: 'Lista de servicios ofrecidos.',
    example: ['Sillas y mesas', 'Carpas', 'Mantelería', 'Montaje'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[];

  @ApiPropertyOptional({
    description: 'Zonas o ciudades con cobertura de servicio.',
    example: ['Ciudad Juárez', 'Chihuahua'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  coverageAreas?: string[];

  @ApiPropertyOptional({
    description: 'Términos y condiciones legales impresos en contratos.',
    example: 'El cliente se compromete a entregar el mobiliario en buen estado.',
  })
  @IsOptional()
  @IsString()
  termsAndConditions?: string;
}
