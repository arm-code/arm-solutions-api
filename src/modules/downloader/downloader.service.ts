import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as crypto from 'crypto';
import { spawn } from 'child_process';
import * as archiverLib from 'archiver';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const archiver = (archiverLib as any).default ?? archiverLib;

import { DownloadAudioDto } from './dto/download-audio.dto';
import { GetMediaInfoDto } from './dto/get-media-info.dto';
import {
  MediaMetadataResponse,
  PlaylistEntry,
  ProcessedFileResult,
  SpawnOptions,
} from './interfaces/downloader.interfaces';
import {
  DownloaderException,
} from './exceptions/downloader.exception';

@Injectable()
export class DownloaderService {
  private readonly logger = new Logger(DownloaderService.name);

  /** Ruta al binario yt-dlp (configurable vía YTDLP_BIN, default 'yt-dlp'). */
  private readonly ytDlpBin: string;

  /** Ruta al binario ffmpeg (configurable vía FFMPEG_BIN, default 'ffmpeg'). */
  private readonly ffmpegBin: string;

  /**
   * Duración máxima en segundos permitida por request.
   * Configurado con DOWNLOADER_MAX_DURATION_SEC (default: 3600 = 1 hora).
   */
  private readonly maxDurationSec: number;

  constructor(private readonly configService: ConfigService) {
    this.ytDlpBin = this.configService.get<string>('YTDLP_BIN', 'yt-dlp');
    this.ffmpegBin = this.configService.get<string>('FFMPEG_BIN', 'ffmpeg');
    this.maxDurationSec = this.configService.get<number>(
      'DOWNLOADER_MAX_DURATION_SEC',
      3600,
    );
  }

  // ─── API Pública ────────────────────────────────────────────────────────────

  /**
   * Descarga el audio de un video de YouTube o todos los audios de una playlist.
   * Retorna la ruta al archivo MP3 generado o al ZIP comprimido de la playlist.
   *
   * @param dto  Opciones de descarga validadas.
   * @returns    Objeto `ProcessedFileResult` con la ruta y metadata del archivo.
   */
  async downloadAudio(dto: DownloadAudioDto): Promise<ProcessedFileResult> {
    const tmpDir = await this.createTmpDir();
    this.logger.log(`[downloadAudio] Directorio temporal: ${tmpDir}`);

    try {
      const args = this.buildYtDlpArgs(dto, tmpDir);
      await this.spawnYtDlp({ args, cwd: tmpDir, timeoutMs: this.maxDurationSec * 1000 });

      if (dto.isPlaylist) {
        return await this.buildPlaylistResult(tmpDir);
      }

      return await this.buildSingleTrackResult(tmpDir);
    } catch (error) {
      // Limpieza inmediata si falla durante el proceso (no durante streaming)
      await this.cleanupDir(tmpDir);
      throw error;
    }
  }

  /**
   * Extrae metadata de un video o playlist de YouTube sin descargar el archivo.
   * Usa `yt-dlp --dump-json --flat-playlist` internamente.
   *
   * @param dto  DTO con la URL a inspeccionar.
   * @returns    Objeto `MediaMetadataResponse` con título, duración, etc.
   */
  async getMediaInfo(dto: GetMediaInfoDto): Promise<MediaMetadataResponse> {
    const tmpDir = await this.createTmpDir();

    try {
      const args = [
        '--dump-json',
        '--flat-playlist',
        '--no-playlist',  // se sobreescribe si la URL es playlist
        '--skip-download',
        dto.url,
      ];

      const stdout = await this.spawnYtDlpWithOutput({ args, cwd: tmpDir });
      return this.parseMetadataOutput(stdout);
    } catch (error) {
      if (error instanceof DownloaderException) throw error;
      throw new DownloaderException(
        `Error al obtener metadata: ${(error as Error).message}`,
        'METADATA_PARSE_ERROR',
        HttpStatus.BAD_GATEWAY,
      );
    } finally {
      await this.cleanupDir(tmpDir);
    }
  }

  /**
   * Limpia el directorio temporal. Debe llamarse desde el controlador
   * en los eventos `res.on('finish')` y `res.on('close')` para garantizar
   * limpieza incluso si el cliente cancela la descarga.
   */
  async cleanupDir(dir: string): Promise<void> {
    try {
      await fs.promises.rm(dir, { recursive: true, force: true });
      this.logger.log(`[cleanup] Directorio eliminado: ${dir}`);
    } catch (err) {
      this.logger.warn(`[cleanup] No se pudo eliminar ${dir}: ${(err as Error).message}`);
    }
  }

  // ─── Construcción de argumentos yt-dlp ──────────────────────────────────────

  /**
   * Construye el array de argumentos para el proceso yt-dlp según el DTO.
   */
  private buildYtDlpArgs(dto: DownloadAudioDto, outDir: string): string[] {
    const quality = dto.audioQuality ?? '0';
    const outputTemplate = path.join(outDir, '%(title)s.%(ext)s');

    const args: string[] = [
      '--ffmpeg-location', this.ffmpegBin,
      '--no-part',            // Sin archivos .part al descargar
      '--no-mtime',           // No modificar fechas de archivo
      '--extract-audio',
      '--audio-format', 'mp3',
      '--audio-quality', quality,
      '-o', outputTemplate,
    ];

    if (dto.embedMetadata !== false) {
      args.push('--embed-metadata');
      args.push('--add-metadata');
    }

    if (dto.embedThumbnail !== false) {
      args.push('--embed-thumbnail');
      args.push('--convert-thumbnails', 'jpg');
    }

    if (dto.isPlaylist) {
      // Playlist: descarga todos los items
      args.push('--yes-playlist');
    } else {
      // Video individual: ignora listas aunque la URL las incluya
      args.push('--no-playlist');
    }

    args.push(dto.url);
    return args;
  }

  // ─── Spawn de subprocesos ────────────────────────────────────────────────────

  /**
   * Ejecuta yt-dlp como subproceso y espera a que finalice.
   * Rechaza la Promise si el proceso termina con código ≠ 0 o excede el timeout.
   */
  private spawnYtDlp(options: SpawnOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      this.logger.log(`[spawn] ${this.ytDlpBin} ${options.args.join(' ')}`);

      let process;
      try {
        process = spawn(this.ytDlpBin, options.args, {
          cwd: options.cwd,
          stdio: ['ignore', 'pipe', 'pipe'],
        });
      } catch {
        return reject(
          new DownloaderException(
            `No se pudo iniciar el binario "${this.ytDlpBin}". ` +
            'Verifique que yt-dlp esté instalado y disponible en el PATH.',
            'YTDLP_SPAWN_FAILED',
            HttpStatus.SERVICE_UNAVAILABLE,
          ),
        );
      }

      const stderrChunks: string[] = [];

      process.stderr?.on('data', (chunk: Buffer) => {
        const line = chunk.toString();
        stderrChunks.push(line);
        this.logger.verbose(`[yt-dlp stderr] ${line.trim()}`);
      });

      process.stdout?.on('data', (chunk: Buffer) => {
        this.logger.verbose(`[yt-dlp stdout] ${chunk.toString().trim()}`);
      });

      const timeout = options.timeoutMs
        ? setTimeout(() => {
            process.kill('SIGTERM');
            reject(
              new DownloaderException(
                `La descarga excedió el tiempo máximo permitido (${Math.round((options.timeoutMs ?? 0) / 60000)} minutos).`,
                'TIMEOUT',
                HttpStatus.REQUEST_TIMEOUT,
              ),
            );
          }, options.timeoutMs)
        : null;

      process.on('close', (code: number | null) => {
        if (timeout) clearTimeout(timeout);

        if (code === 0) {
          resolve();
        } else {
          const errMessage = stderrChunks.join('').slice(-800); // últimas ~800 chars
          reject(
            new DownloaderException(
              `yt-dlp terminó con código ${code ?? 'desconocido'}. ` +
              `Detalle: ${errMessage || 'Sin información adicional.'}`,
              'YTDLP_PROCESS_ERROR',
              HttpStatus.BAD_GATEWAY,
            ),
          );
        }
      });

      process.on('error', (err: Error) => {
        if (timeout) clearTimeout(timeout);
        reject(
          new DownloaderException(
            `Error en el proceso de descarga: ${err.message}`,
            'YTDLP_SPAWN_FAILED',
            HttpStatus.SERVICE_UNAVAILABLE,
          ),
        );
      });
    });
  }

  /**
   * Versión de `spawnYtDlp` que captura y retorna el stdout completo.
   * Se usa para operaciones de metadata (`--dump-json`).
   */
  private spawnYtDlpWithOutput(options: SpawnOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      this.logger.log(`[spawn-output] ${this.ytDlpBin} ${options.args.join(' ')}`);

      let process;
      try {
        process = spawn(this.ytDlpBin, options.args, {
          cwd: options.cwd,
          stdio: ['ignore', 'pipe', 'pipe'],
        });
      } catch {
        return reject(
          new DownloaderException(
            `No se pudo iniciar el binario "${this.ytDlpBin}".`,
            'YTDLP_SPAWN_FAILED',
            HttpStatus.SERVICE_UNAVAILABLE,
          ),
        );
      }

      const stdoutChunks: string[] = [];
      const stderrChunks: string[] = [];

      process.stdout?.on('data', (chunk: Buffer) => stdoutChunks.push(chunk.toString()));
      process.stderr?.on('data', (chunk: Buffer) => stderrChunks.push(chunk.toString()));

      const timeout = options.timeoutMs
        ? setTimeout(() => {
            process.kill('SIGTERM');
            reject(
              new DownloaderException(
                'La solicitud de metadata excedió el tiempo de espera.',
                'TIMEOUT',
                HttpStatus.REQUEST_TIMEOUT,
              ),
            );
          }, options.timeoutMs ?? 30_000)
        : null;

      process.on('close', (code: number | null) => {
        if (timeout) clearTimeout(timeout);
        if (code === 0) {
          resolve(stdoutChunks.join(''));
        } else {
          reject(
            new DownloaderException(
              `yt-dlp terminó con error al obtener metadata. ${stderrChunks.join('').slice(-500)}`,
              'YTDLP_PROCESS_ERROR',
              HttpStatus.BAD_GATEWAY,
            ),
          );
        }
      });

      process.on('error', (err: Error) => {
        if (timeout) clearTimeout(timeout);
        reject(
          new DownloaderException(
            `Error al obtener metadata: ${err.message}`,
            'YTDLP_SPAWN_FAILED',
            HttpStatus.SERVICE_UNAVAILABLE,
          ),
        );
      });
    });
  }

  // ─── Parseo de resultados ────────────────────────────────────────────────────

  /**
   * Busca el primer archivo MP3 generado en el directorio temporal
   * y construye el `ProcessedFileResult` para respuesta de canción individual.
   */
  private async buildSingleTrackResult(tmpDir: string): Promise<ProcessedFileResult> {
    const files = await fs.promises.readdir(tmpDir);
    const mp3 = files.find((f) => f.endsWith('.mp3'));

    if (!mp3) {
      throw new DownloaderException(
        'El proceso de descarga finalizó pero no se encontró ningún archivo MP3.',
        'FILE_NOT_FOUND',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return {
      filePath: path.join(tmpDir, mp3),
      fileName: mp3,
      isZip: false,
      tmpDir,
    };
  }

  /**
   * Comprime todos los MP3 de una carpeta de playlist en un ZIP
   * y construye el `ProcessedFileResult`.
   */
  private async buildPlaylistResult(tmpDir: string): Promise<ProcessedFileResult> {
    const files = await fs.promises.readdir(tmpDir);
    const mp3Files = files.filter((f) => f.endsWith('.mp3'));

    if (mp3Files.length === 0) {
      throw new DownloaderException(
        'La playlist no generó ningún archivo de audio. ' +
        'Verifique que la URL sea correcta y que la playlist tenga contenido disponible.',
        'PLAYLIST_EMPTY',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const zipName = `playlist_${crypto.randomBytes(6).toString('hex')}.zip`;
    const zipPath = path.join(tmpDir, zipName);

    await this.compressToZip(tmpDir, zipPath, mp3Files);

    return {
      filePath: zipPath,
      fileName: zipName,
      isZip: true,
      tmpDir,
    };
  }

  /**
   * Comprime una lista de archivos de un directorio en un ZIP usando `archiver`.
   */
  private compressToZip(
    sourceDir: string,
    outputPath: string,
    files: string[],
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', { zlib: { level: 6 } });

      output.on('close', () => {
        this.logger.log(`[zip] Comprimido: ${outputPath} (${archive.pointer()} bytes)`);
        resolve();
      });

      archive.on('error', (err: Error) => {
        reject(
          new DownloaderException(
            `Error al comprimir la playlist: ${err.message}`,
            'COMPRESSION_ERROR',
            HttpStatus.INTERNAL_SERVER_ERROR,
          ),
        );
      });

      archive.pipe(output);

      for (const file of files) {
        archive.file(path.join(sourceDir, file), { name: file });
      }

      void archive.finalize();
    });
  }

  /**
   * Parsea el JSON de salida de `yt-dlp --dump-json` y construye
   * el objeto `MediaMetadataResponse`.
   * Soporta tanto la salida de un video individual como de una playlist
   * (múltiples líneas JSON o un solo objeto con `_type: "playlist"`).
   */
  private parseMetadataOutput(raw: string): MediaMetadataResponse {
    try {
      const lines = raw
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.startsWith('{'));

      if (lines.length === 0) {
        throw new Error('Sin datos JSON en la salida de yt-dlp.');
      }

      // Cada línea es un objeto JSON independiente (video o entrada de playlist)
      const objects = lines.map((l) => JSON.parse(l) as Record<string, unknown>);
      const first = objects[0];

      const isPlaylist =
        first['_type'] === 'playlist' ||
        (typeof first['entries'] !== 'undefined');

      if (isPlaylist) {
        const entries = (first['entries'] as Record<string, unknown>[] | undefined) ?? objects;
        const playlistEntries: PlaylistEntry[] = entries
          .slice(0, 200) // máx 200 entradas para evitar payloads gigantes
          .map((e) => ({
            title: String(e['title'] ?? e['id'] ?? 'Sin título'),
            duration: typeof e['duration'] === 'number' ? e['duration'] : null,
            url: String(
              e['url'] ??
              e['webpage_url'] ??
              `https://www.youtube.com/watch?v=${String(e['id'])}`,
            ),
            uploader: e['uploader'] ? String(e['uploader']) : null,
          }));

        return {
          title: String(first['title'] ?? first['playlist_title'] ?? 'Playlist sin título'),
          duration: null,
          uploader: String(first['uploader'] ?? first['channel'] ?? 'Desconocido'),
          thumbnail: first['thumbnail'] ? String(first['thumbnail']) : null,
          isPlaylist: true,
          entryCount: playlistEntries.length,
          entries: playlistEntries,
        };
      }

      // Video individual
      return {
        title: String(first['title'] ?? 'Sin título'),
        duration: typeof first['duration'] === 'number' ? first['duration'] : null,
        uploader: String(first['uploader'] ?? first['channel'] ?? 'Desconocido'),
        thumbnail: first['thumbnail'] ? String(first['thumbnail']) : null,
        isPlaylist: false,
      };
    } catch (err) {
      throw new DownloaderException(
        `No se pudo interpretar la respuesta de yt-dlp: ${(err as Error).message}`,
        'METADATA_PARSE_ERROR',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // ─── Utilidades de sistema de archivos ──────────────────────────────────────

  /**
   * Crea un directorio temporal único para este request.
   * Formato: `<os.tmpdir()>/ytdlp-<uuid>`.
   */
  private async createTmpDir(): Promise<string> {
    const tmpBase = path.join(os.tmpdir(), `ytdlp-${crypto.randomUUID()}`);
    await fs.promises.mkdir(tmpBase, { recursive: true });
    return tmpBase;
  }
}
