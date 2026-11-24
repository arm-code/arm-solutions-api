import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { dirname, extname, resolve, sep } from 'path';

export interface UploadResult {
  /** URL pública permanente del archivo. */
  url: string;
  /** Path relativo del archivo dentro del directorio de storage. */
  path: string;
}

/**
 * Almacenamiento de archivos en disco local (reemplaza a Supabase Storage).
 *
 * Estructura: `<STORAGE_DIR>/<businessId>/<folder>/<uuid>.<ext>`
 * Se sirve públicamente en `<STORAGE_PUBLIC_URL>/<path>` (ver main.ts).
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly rootDir: string;
  private readonly publicBaseUrl: string;

  private static readonly ALLOWED_IMAGE_EXTS = new Set([
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
    '.gif',
    '.avif',
  ]);

  /** Tamaño máximo de imagen: 10 MB. */
  private static readonly MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

  /** Segmentos de ruta permitidos (evita `..`, `/` y similares). */
  private static readonly SAFE_SEGMENT = /^[A-Za-z0-9_-]+$/;

  constructor(private readonly configService: ConfigService) {
    this.rootDir = resolve(
      this.configService.get<string>('STORAGE_DIR') ?? './storage',
    );
    this.publicBaseUrl = this.configService
      .getOrThrow<string>('STORAGE_PUBLIC_URL')
      .replace(/\/+$/, '');
  }

  /** Directorio raíz en disco; main.ts lo publica como archivos estáticos. */
  getRootDir(): string {
    return this.rootDir;
  }

  async uploadImage(
    buffer: Buffer,
    originalName: string,
    businessId: string,
    folder: string,
  ): Promise<UploadResult> {
    const ext = extname(originalName).toLowerCase();
    if (!StorageService.ALLOWED_IMAGE_EXTS.has(ext)) {
      throw new BadRequestException(
        `Extensión no permitida: "${ext}". Usa: jpg, jpeg, png, webp, gif, avif.`,
      );
    }

    if (buffer.byteLength > StorageService.MAX_IMAGE_SIZE_BYTES) {
      throw new BadRequestException(
        `El archivo supera el límite de 10 MB (${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB).`,
      );
    }

    // La extensión la pone el cliente: verificamos que el contenido sea de verdad una imagen
    if (!this.hasImageSignature(buffer)) {
      throw new BadRequestException('El archivo no es una imagen válida.');
    }

    for (const segment of [businessId, folder]) {
      if (!StorageService.SAFE_SEGMENT.test(segment)) {
        throw new BadRequestException('Ruta de archivo inválida.');
      }
    }

    const path = `${businessId}/${folder}/${randomUUID()}${ext}`;
    const absolute = this.toAbsolute(path);
    if (!absolute) throw new BadRequestException('Ruta de archivo inválida.');

    try {
      await fs.mkdir(dirname(absolute), { recursive: true });
      await fs.writeFile(absolute, buffer, { flag: 'wx' });
    } catch (err) {
      this.logger.error(`Error al guardar imagen en disco: ${(err as Error).message}`);
      throw new InternalServerErrorException('No se pudo guardar la imagen.');
    }

    const url = `${this.publicBaseUrl}/${path}`;
    this.logger.log(`Imagen guardada: ${path}`);
    return { url, path };
  }

  /** Elimina un archivo por su path relativo. Idempotente: no falla si no existe. */
  async deleteFile(path: string): Promise<void> {
    const absolute = this.toAbsolute(path);
    if (!absolute) {
      this.logger.warn(`Ruta rechazada al eliminar: "${path}"`);
      return;
    }
    try {
      await fs.unlink(absolute);
      this.logger.log(`Archivo eliminado: ${path}`);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.logger.warn(`No se pudo eliminar "${path}": ${(err as Error).message}`);
      }
    }
  }

  /**
   * Extrae el path relativo de una URL pública de este storage.
   * Devuelve `null` si la URL no es nuestra (p. ej. una URL vieja de Supabase).
   */
  extractPath(publicUrl: string): string | null {
    const prefix = `${this.publicBaseUrl}/`;
    if (!publicUrl.startsWith(prefix)) return null;
    return publicUrl.slice(prefix.length);
  }

  /** Convierte un path relativo en absoluto, garantizando que quede dentro de rootDir. */
  private toAbsolute(path: string): string | null {
    const absolute = resolve(this.rootDir, path);
    return absolute.startsWith(this.rootDir + sep) ? absolute : null;
  }

  private hasImageSignature(b: Buffer): boolean {
    if (b.length < 12) return false;
    const isJpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    const isPng = b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const isGif = b.subarray(0, 4).toString('ascii') === 'GIF8';
    const isWebp =
      b.subarray(0, 4).toString('ascii') === 'RIFF' &&
      b.subarray(8, 12).toString('ascii') === 'WEBP';
    const isAvif = b.subarray(4, 8).toString('ascii') === 'ftyp';
    return isJpeg || isPng || isGif || isWebp || isAvif;
  }
}
