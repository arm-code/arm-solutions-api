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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionsService } from './transactions.service';

/**
 * Movimientos de ingreso (INPUT) y egreso (OUTPUT) del negocio.
 * Equivalente normalizado de la hoja `io` del Excel original.
 */
@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ResponseMessage('Transacción creada exitosamente.')
  @ApiOperation({
    summary: 'Registrar un nuevo movimiento (ingreso o egreso).',
  })
  @SwaggerApiResponse({
    status: 201,
    description: 'Transacción creada.',
    schema: {
      example: {
        success: true,
        message: 'Transacción creada exitosamente.',
        data: {
          id: 'f1a1b2c4-1234-4d5e-8f6a-000000000004',
          folio: 'FOL-0001',
          transactionDate: '2026-07-17',
          type: 'INPUT',
          description: '10 MESAS G + 80 SILLAS + BRINCA B',
          amount: 1550,
          category: {
            id: 'c8f1b2c4-1234-4d5e-8f6a-000000000002',
            code: 'RENTA',
            name: 'Renta de mobiliario/equipo',
          },
          paymentMethod: {
            id: 'a3f1b2c4-1234-4d5e-8f6a-000000000001',
            code: 'TRANSFER',
            name: 'Transferencia',
          },
          businessEvent: {
            id: 'e1f1b2c4-1234-4d5e-8f6a-000000000003',
            name: 'EVENTO NEGRO TALIBAN',
          },
          createdAt: '2026-07-17T10:00:00.000Z',
          updatedAt: '2026-07-17T10:00:00.000Z',
        },
      },
    },
  })
  @SwaggerApiResponse({
    status: 400,
    description: 'Categoría, método de pago o evento inválido/inexistente.',
  })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTransactionDto,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.create(user.id, dto);
  }

  @Get()
  @ResponseMessage('Transacciones obtenidas exitosamente.')
  @ApiOperation({
    summary:
      'Listar transacciones del usuario autenticado (paginado, filtros por tipo/categoría/método de pago/evento/rango de fechas y búsqueda por descripción).',
  })
  @SwaggerApiResponse({
    status: 200,
    description: 'Listado paginado.',
    schema: {
      example: {
        success: true,
        message: 'Transacciones obtenidas exitosamente.',
        data: {
          items: [
            {
              id: 'f1a1b2c4-1234-4d5e-8f6a-000000000004',
              folio: 'FOL-0001',
              transactionDate: '2026-07-17',
              type: 'INPUT',
              description: '10 MESAS G + 80 SILLAS + BRINCA B',
              amount: 1550,
              category: {
                id: 'c8f1b2c4-1234-4d5e-8f6a-000000000002',
                code: 'RENTA',
                name: 'Renta de mobiliario/equipo',
              },
              paymentMethod: {
                id: 'a3f1b2c4-1234-4d5e-8f6a-000000000001',
                code: 'TRANSFER',
                name: 'Transferencia',
              },
              businessEvent: {
                id: 'e1f1b2c4-1234-4d5e-8f6a-000000000003',
                name: 'EVENTO NEGRO TALIBAN',
              },
              createdAt: '2026-07-17T10:00:00.000Z',
              updatedAt: '2026-07-17T10:00:00.000Z',
            },
          ],
          meta: {
            page: 1,
            limit: 10,
            totalItems: 1,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
      },
    },
  })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryTransactionDto,
  ) {
    return this.transactionsService.findAll(user.id, query);
  }

  @Get('summary')
  @ResponseMessage('Resumen de transacciones obtenido exitosamente.')
  @ApiOperation({
    summary: 'Obtener el resumen de transacciones (totalInputs, totalOutputs, balance).',
  })
  @SwaggerApiResponse({
    status: 200,
    description: 'Resumen de totales históricos.',
    schema: {
      example: {
        success: true,
        message: 'Resumen de transacciones obtenido exitosamente.',
        data: {
          totalInputs: 15000,
          totalOutputs: 5000,
          balance: 10000,
        },
      },
    },
  })
  getSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.transactionsService.getSummary(user.id);
  }

  @Get(':id')
  @ResponseMessage('Transacción obtenida exitosamente.')
  @ApiOperation({ summary: 'Obtener una transacción por id.' })
  @SwaggerApiResponse({
    status: 404,
    description: 'No encontrada o pertenece a otro usuario.',
  })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.findOne(user.id, id);
  }

  @Patch(':id')
  @ResponseMessage('Transacción actualizada exitosamente.')
  @ApiOperation({ summary: 'Actualizar parcialmente una transacción.' })
  @SwaggerApiResponse({
    status: 404,
    description: 'No encontrada o pertenece a otro usuario.',
  })
  @SwaggerApiResponse({
    status: 400,
    description: 'Categoría, método de pago o evento inválido/inexistente.',
  })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTransactionDto,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Transacción eliminada exitosamente.')
  @ApiOperation({ summary: 'Eliminar una transacción de forma permanente.' })
  @SwaggerApiResponse({
    status: 404,
    description: 'No encontrada o pertenece a otro usuario.',
  })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<null> {
    await this.transactionsService.remove(user.id, id);
    return null;
  }
}
