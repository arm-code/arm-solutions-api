import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { ApiErrorResponse } from '../interfaces/api-response.interface';

/**
 * Captura TODAS las excepciones (HTTP conocidas, errores de TypeORM y
 * cualquier error inesperado) y responde siempre con el contrato:
 * `{ success: false, message, data: null, errorCode, errors }`.
 *
 * Nunca se filtran stack traces ni detalles internos al cliente; solo se
 * loguean en el servidor.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Ha ocurrido un error interno en el servidor.';
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let errors: string[] | Record<string, unknown> | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      errorCode = HttpStatus[statusCode] ?? 'HTTP_EXCEPTION';

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const body = exceptionResponse as {
          message?: string | string[];
          error?: string;
        };
        if (Array.isArray(body.message)) {
          // Errores de class-validator (ValidationPipe)
          message = 'Error de validación en los datos enviados.';
          errors = body.message;
          errorCode = 'VALIDATION_ERROR';
        } else {
          message = body.message ?? body.error ?? message;
        }
      }
    } else if (exception instanceof QueryFailedError) {
      // Errores comunes de PostgreSQL mapeados a algo entendible
      statusCode = HttpStatus.CONFLICT;
      errorCode = 'DATABASE_ERROR';
      message = this.mapDatabaseError(exception as QueryFailedError<Error>);
    } else if (exception instanceof Error) {
      message = exception.message || message;
    }

    // Log completo solo del lado del servidor (nunca se expone al cliente)
    this.logger.error(
      `${request.method} ${request.url} -> ${statusCode} :: ${
        exception instanceof Error ? exception.stack : JSON.stringify(exception)
      }`,
    );

    const body: ApiErrorResponse = {
      success: false,
      message,
      data: null,
      errorCode,
      ...(errors ? { errors } : {}),
    };

    response.status(statusCode).json(body);
  }

  private mapDatabaseError(error: QueryFailedError<Error>): string {
    const driverError = error.driverError as
      { code?: string; detail?: string } | undefined;
    switch (driverError?.code) {
      case '23505':
        return 'El registro ya existe (violación de unicidad).';
      case '23503':
        return 'La operación viola una relación con otro registro (llave foránea).';
      case '23502':
        return 'Falta un campo obligatorio.';
      default:
        return 'Error al procesar la operación en la base de datos.';
    }
  }
}
