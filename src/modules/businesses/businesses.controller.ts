import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ResponseMessage } from '../../common/interceptors/transform.interceptor';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { BusinessesService } from './businesses.service';
import { BusinessResponseDto } from './dto/business-response.dto';
import { CreateBusinessDto } from './dto/create-business.dto';

/**
 * Gestión de negocios (tenants).
 *
 * NOTA: Estos endpoints NO requieren `TenantGuard` porque son los que el
 * frontend usa para descubrir/crear los negocios disponibles ANTES de
 * seleccionar uno activo.
 */
@ApiTags('Businesses')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businessesService: BusinessesService) {}

  @Get()
  @ResponseMessage('Negocios obtenidos exitosamente.')
  @ApiOperation({
    summary:
      'Lista los negocios a los que pertenece el usuario autenticado, ' +
      'incluyendo su rol en cada uno.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de negocios del usuario.',
    type: [BusinessResponseDto],
  })
  getMyBusinesses(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<BusinessResponseDto[]> {
    return this.businessesService.getMyBusinesses(user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('Negocio creado exitosamente.')
  @ApiOperation({
    summary:
      'Crea un nuevo negocio. El usuario autenticado queda registrado ' +
      'automáticamente como administrador (role: admin).',
  })
  @ApiResponse({
    status: 201,
    description: 'Negocio creado.',
    type: BusinessResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'El slug ya está en uso.',
  })
  createBusiness(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBusinessDto,
  ): Promise<BusinessResponseDto> {
    return this.businessesService.createBusiness(user.id, dto);
  }
}
