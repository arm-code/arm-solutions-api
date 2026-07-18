/**
 * Contrato único de respuesta para TODOS los endpoints de la API.
 *
 * Se aplica de forma automática por el `TransformInterceptor` (éxito) y por el
 * `AllExceptionsFilter` (error), por lo que los controladores NUNCA deben
 * construir este objeto manualmente: solo retornan `data` (o lanzan una excepción).
 */
export interface ApiResponse<T = unknown> {
  /** Indica si la operación se completó correctamente. */
  success: boolean;
  /** Mensaje legible para el humano (UI, logs, debugging). */
  message: string;
  /** Payload de la respuesta. `null` en la mayoría de los errores. */
  data: T | null;
  /** Metadatos opcionales (paginación, timestamps, etc.). */
  meta?: Record<string, unknown>;
}

/** Forma estándar de un error dentro de `ApiResponse`. */
export interface ApiErrorResponse extends ApiResponse<null> {
  success: false;
  data: null;
  /** Código de error interno, útil para manejo programático en el frontend. */
  errorCode?: string;
  /** Detalle de errores de validación (class-validator) u otros detalles. */
  errors?: string[] | Record<string, unknown>;
}
