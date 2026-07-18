import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';

/** Metadata key usada por el decorador `@ResponseMessage()`. */
export const RESPONSE_MESSAGE_KEY = 'response_message';

/**
 * Permite personalizar el `message` de éxito de un endpoint.
 * Uso: `@ResponseMessage('Transacción creada correctamente.')`
 */
export const ResponseMessage = (message: string) =>
  SetMetadata(RESPONSE_MESSAGE_KEY, message);

/**
 * Envuelve automáticamente CUALQUIER valor retornado por un controlador en:
 * `{ success: true, message, data }`.
 *
 * Si el propio handler ya retorna un objeto `PaginatedResultDto`, este se
 * expone en `data.items` + `data.meta`, manteniendo el contrato uniforme.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    const customMessage = this.reflector.get<string>(
      RESPONSE_MESSAGE_KEY,
      context.getHandler(),
    );

    return next.handle().pipe(
      map((data) => ({
        success: true,
        message: customMessage ?? 'Operación realizada exitosamente.',
        data: data ?? null,
      })),
    );
  }
}
