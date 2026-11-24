import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'dueno@mi-negocio.mx' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ description: 'Contraseña de la cuenta.' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password: string;
}
