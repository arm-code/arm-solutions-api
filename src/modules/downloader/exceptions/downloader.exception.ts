import { HttpException, HttpStatus } from '@nestjs/common';

export type DownloaderErrorCode =
  | 'YTDLP_SPAWN_FAILED'
  | 'YTDLP_PROCESS_ERROR'
  | 'INVALID_URL'
  | 'PLAYLIST_EMPTY'
  | 'FILE_NOT_FOUND'
  | 'COMPRESSION_ERROR'
  | 'TIMEOUT'
  | 'METADATA_PARSE_ERROR';

/**
 * Excepción unificada para todos los errores del DownloaderModule.
 * Extiende HttpException para ser capturada por el AllExceptionsFilter global.
 */
export class DownloaderException extends HttpException {
  public readonly errorCode: DownloaderErrorCode;

  constructor(
    message: string,
    errorCode: DownloaderErrorCode,
    status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
  ) {
    super({ message, errorCode }, status);
    this.errorCode = errorCode;
  }
}
