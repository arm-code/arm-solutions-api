import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ResponseMessage } from '../../common/interceptors/transform.interceptor';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { PaymentMethodResponseDto } from './dto/payment-method-response.dto';
import { QueryPaymentMethodDto } from './dto/query-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { PaymentMethodsService } from './payment-methods.service';

/**
 * Catálogo de métodos de pago (CASH, TRANSFER, ...).
 *
 * Todos los endpoints requieren un JWT válido de Supabase Auth
 * (`Authorization: Bearer <access_token>`).
 */
@ApiTags('Payment Methods')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('payment-methods')
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @Post()
  @ResponseMessage('Método de pago creado exitosamente.')
  @ApiOperation({ summary: 'Crear un nuevo método de pago.' })
  @SwaggerApiResponse({
    status: 201,
    description: 'Método de pago creado.',
    schema: {
      example: {
        success: true,
        message: 'Método de pago creado exitosamente.',
        data: {
          id: 'a3f1b2c4-1234-4d5e-8f6a-000000000001',
          code: 'CARD',
          name: 'Tarjeta',
          isActive: true,
          createdAt: '2026-07-17T10:00:00.000Z',
          updatedAt: '2026-07-17T10:00:00.000Z',
        },
      },
    },
  })
  @SwaggerApiResponse({ status: 409, description: 'El código ya existe.' })
  create(
    @Body() dto: CreatePaymentMethodDto,
  ): Promise<PaymentMethodResponseDto> {
    return this.paymentMethodsService.create(dto);
  }

  @Get()
  @ResponseMessage('Métodos de pago obtenidos exitosamente.')
  @ApiOperation({
    summary: 'Listar métodos de pago (paginado, búsqueda y filtro por estado).',
  })
  @SwaggerApiResponse({
    status: 200,
    description: 'Listado paginado.',
    schema: {
      example: {
        success: true,
        message: 'Métodos de pago obtenidos exitosamente.',
        data: {
          items: [
            {
              id: 'a3f1b2c4-1234-4d5e-8f6a-000000000001',
              code: 'CASH',
              name: 'Efectivo',
              isActive: true,
              createdAt: '2026-07-17T10:00:00.000Z',
              updatedAt: '2026-07-17T10:00:00.000Z',
            },
          ],
          meta: {
            page: 1,
            limit: 10,
            totalItems: 2,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
      },
    },
  })
  findAll(@Query() query: QueryPaymentMethodDto) {
    return this.paymentMethodsService.findAll(query);
  }

  @Get(':id')
  @ResponseMessage('Método de pago obtenido exitosamente.')
  @ApiOperation({ summary: 'Obtener un método de pago por id.' })
  @SwaggerApiResponse({ status: 404, description: 'No encontrado.' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PaymentMethodResponseDto> {
    return this.paymentMethodsService.findOne(id);
  }

  @Patch(':id')
  @ResponseMessage('Método de pago actualizado exitosamente.')
  @ApiOperation({ summary: 'Actualizar parcialmente un método de pago.' })
  @SwaggerApiResponse({ status: 404, description: 'No encontrado.' })
  @SwaggerApiResponse({ status: 409, description: 'El código ya existe.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePaymentMethodDto,
  ): Promise<PaymentMethodResponseDto> {
    return this.paymentMethodsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Método de pago desactivado exitosamente.')
  @ApiOperation({
    summary:
      'Desactivar un método de pago (soft delete, preserva histórico de transacciones).',
  })
  @SwaggerApiResponse({ status: 404, description: 'No encontrado.' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<null> {
    await this.paymentMethodsService.remove(id);
    return null;
  }
}
