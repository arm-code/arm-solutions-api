import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import * as fs from 'fs';

import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { DownloadAudioDto } from './dto/download-audio.dto';
import { GetMediaInfoDto } from './dto/get-media-info.dto';
import { DownloaderService } from './downloader.service';

@ApiTags('Downloader — Audio de YouTube')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('download')
export class DownloaderController {
  private readonly logger = new Logger(DownloaderController.name);

  constructor(private readonly downloaderService: DownloaderService) {}

  // ─── POST /download/audio ────────────────────────────────────────────────────

  @Post('audio')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Descargar audio de YouTube',
    description:
      'Descarga el audio de un video individual o de una playlist completa de YouTube ' +
      'en formato MP3.\n\n' +
      '- **Video individual** → retorna un archivo `.mp3` directamente en el stream.\n' +
      '- **Playlist** → descarga todos los audios y los retorna comprimidos en un `.zip`.\n\n' +
      'El audio se convierte a MP3 con `ffmpeg`. La calidad es configurable mediante VBR ' +
      '(Variable Bit Rate), donde `"0"` representa la mejor calidad (~320kbps) y `"9"` ' +
      'la menor. Los metadatos (título, artista, carátula) se incrustan en el archivo por ' +
      'defecto usando etiquetas ID3.',
  })
  @ApiBody({
    type: DownloadAudioDto,
    examples: {
      single_track: {
        summary: 'Video individual (máxima calidad)',
        value: {
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          isPlaylist: false,
          audioQuality: '0',
          embedThumbnail: true,
          embedMetadata: true,
        },
      },
      playlist: {
        summary: 'Playlist completa',
        value: {
          url: 'https://www.youtube.com/playlist?list=PLxxxxxxxxxxxxxxxxxxxxxx',
          isPlaylist: true,
          audioQuality: '2',
          embedThumbnail: true,
          embedMetadata: true,
        },
      },
      minimal: {
        summary: 'Mínimo requerido (valores por defecto)',
        value: {
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          isPlaylist: false,
        },
      },
    },
  })
  @ApiProduces('audio/mpeg', 'application/zip')
  @ApiResponse({
    status: 200,
    description:
      'Archivo de audio descargado exitosamente. ' +
      'El `Content-Type` será `audio/mpeg` para canciones individuales ' +
      'o `application/zip` para playlists.',
  })
  @ApiResponse({
    status: 400,
    description: 'URL inválida o parámetros incorrectos (ValidationPipe).',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT no proporcionado o inválido.',
  })
  @ApiResponse({
    status: 408,
    description: 'La descarga excedió el tiempo máximo permitido.',
  })
  @ApiResponse({
    status: 502,
    description: 'Error en el proceso yt-dlp (URL no disponible, video privado, etc.).',
  })
  @ApiResponse({
    status: 503,
    description: 'El binario yt-dlp no está disponible en el servidor.',
  })
  async downloadAudio(
    @Body() dto: DownloadAudioDto,
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    this.logger.log(
      `[downloadAudio] URL: ${dto.url} | isPlaylist: ${dto.isPlaylist}`,
    );

    const result = await this.downloaderService.downloadAudio(dto);

    const contentType = result.isZip ? 'application/zip' : 'audio/mpeg';
    const encodedFileName = encodeURIComponent(result.fileName);

    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.fileName}"; filename*=UTF-8''${encodedFileName}`,
    );
    res.setHeader('X-Download-Filename', result.fileName);

    const fileStream = fs.createReadStream(result.filePath);

    // Garantiza limpieza del directorio temporal tanto si el cliente
    // descarga completo ('finish') como si cancela la conexión ('close').
    const cleanup = () => {
      void this.downloaderService.cleanupDir(result.tmpDir);
    };

    res.on('finish', cleanup);
    res.on('close', cleanup);

    fileStream.on('error', (err) => {
      this.logger.error(`[downloadAudio] Error en stream: ${err.message}`);
      if (!res.headersSent) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: 'Error al leer el archivo generado.',
          errorCode: 'FILE_NOT_FOUND',
          data: null,
        });
      }
    });

    fileStream.pipe(res);
  }

  // ─── POST /download/info ─────────────────────────────────────────────────────

  @Post('info')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener metadata de un video o playlist',
    description:
      'Extrae información de un video o playlist de YouTube **sin descargar** el archivo. ' +
      'Útil para previsualizar el contenido antes de iniciar la descarga.\n\n' +
      'Internamente ejecuta `yt-dlp --dump-json --flat-playlist` para obtener únicamente ' +
      'los metadatos sin transferir ningún medio.\n\n' +
      '**Campos retornados:**\n' +
      '- `title` — Título del video o playlist\n' +
      '- `duration` — Duración en segundos (null para playlists)\n' +
      '- `uploader` — Canal o autor\n' +
      '- `thumbnail` — URL de la miniatura de mayor calidad\n' +
      '- `isPlaylist` — `true` si la URL es una playlist\n' +
      '- `entryCount` — Número de canciones (solo playlists)\n' +
      '- `entries` — Lista de canciones con título, duración y URL (máx. 200)',
  })
  @ApiBody({
    type: GetMediaInfoDto,
    examples: {
      single_video: {
        summary: 'Video individual',
        value: {
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        },
      },
      playlist: {
        summary: 'Playlist de YouTube',
        value: {
          url: 'https://www.youtube.com/playlist?list=PLxxxxxxxxxxxxxxxxxxxxxx',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Metadata extraída correctamente.',
    schema: {
      example: {
        success: true,
        message: 'Operación realizada exitosamente.',
        data: {
          title: 'Never Gonna Give You Up',
          duration: 213,
          uploader: 'Rick Astley',
          thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
          isPlaylist: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'URL inválida (no es de YouTube o formato incorrecto).',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT no proporcionado o inválido.',
  })
  @ApiResponse({
    status: 502,
    description: 'No se pudo obtener la metadata (video privado, eliminado, etc.).',
  })
  async getMediaInfo(@Body() dto: GetMediaInfoDto) {
    this.logger.log(`[getMediaInfo] URL: ${dto.url}`);
    return this.downloaderService.getMediaInfo(dto);
  }
}
