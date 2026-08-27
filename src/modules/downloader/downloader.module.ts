import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { DownloaderController } from './downloader.controller';
import { DownloaderService } from './downloader.service';

/**
 * Módulo de descarga de audio desde YouTube.
 *
 * Provee dos endpoints protegidos con JWT:
 * - `POST /api/v1/download/audio` — Descarga MP3 o ZIP de playlist.
 * - `POST /api/v1/download/info`  — Metadata sin descarga.
 *
 * **Requisitos del entorno:**
 * - `yt-dlp` instalado y accesible en el PATH (o configurado en `YTDLP_BIN`).
 * - `ffmpeg` instalado y accesible en el PATH (o configurado en `FFMPEG_BIN`).
 */
@Module({
  imports: [ConfigModule],
  controllers: [DownloaderController],
  providers: [
    DownloaderService,
    // SupabaseAuthGuard requiere Reflector para el soporte de @Public()
    SupabaseAuthGuard,
    Reflector,
  ],
})
export class DownloaderModule {}
