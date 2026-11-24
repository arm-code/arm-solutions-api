import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ResponseMessage } from '../../common/interceptors/transform.interceptor';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { BusinessesService } from './businesses.service';
import { BusinessResponseDto } from './dto/business-response.dto';
import { PublicBusinessResponseDto } from './dto/public-business-response.dto';

/**
 * Negocio de esta instancia. Hay un solo negocio por instancia, así que no
 * existen endpoints para crear, listar ni elegir negocios.
 */
@ApiTags('Businesses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Public()
  @Get('public')
  @ResponseMessage('Información pública del negocio obtenida exitosamente.')
  @ApiOperation({
    summary: 'Información comercial pública y configuración del negocio (landing).',
  })
  @ApiResponse({
    status: 200,
    description: 'Información pública del negocio y su configuración.',
    type: PublicBusinessResponseDto,
  })
  getPublicBusiness(): Promise<PublicBusinessResponseDto> {
    return this.businessesService.getPublicBusiness();
  }

  @Get()
  @ResponseMessage('Negocio obtenido exitosamente.')
  @ApiOperation({
    summary:
      'Negocio de la instancia con el rol del usuario autenticado. ' +
      'Lista vacía si el usuario no pertenece al negocio.',
  })
  @ApiResponse({ status: 200, type: [BusinessResponseDto] })
  getMyBusinesses(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BusinessResponseDto[]> {
    return this.businessesService.getMyBusinesses(user.id);
  }
}
