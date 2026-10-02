import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { extname } from 'path';

export interface UploadResult {
  /** URL pública permanente del archivo en Supabase Storage. */
  url: string;
  /** Path relativo del archivo dentro del bucket. */
  path: string;
}

/**
 * Servicio compartido para subir y eliminar archivos en Supabase Storage.
 *
 * Bucket por defecto: `businesses`
 * Estructura de rutas: `<businessId>/<folder>/<uuid>.<ext>`
 *
 * Los objetos se suben con visibilidad pública y el bucket debe tener
 * la política "Public read" configurada en el panel de Supabase.
 */
@Injectable()
export class SupabaseStorageService {
  private readonly logger = new Logger(SupabaseStorageService.name);
  private readonly client: SupabaseClient;
  private readonly publicBaseUrl: string;

  /** Extensiones de imagen permitidas (en minúsculas). */
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

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.getOrThrow<string>('SUPABASE_URL');
    const supabaseKey = this.configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY');
    this.client = createClient(supabaseUrl, supabaseKey);
    this.publicBaseUrl = `${supabaseUrl}/storage/v1/object/public`;
  }

  /**
   * Sube un buffer de imagen a Supabase Storage.
   *
   * @param buffer        - Contenido del archivo.
   * @param originalName  - Nombre original del archivo (para extraer extensión).
   * @param businessId    - UUID del negocio (usado en la ruta del objeto).
   * @param folder        - Sub-carpeta dentro del negocio, p.ej: "logo", "gallery".
   * @param bucket        - Nombre del bucket de Supabase (default: "businesses").
   */
  async uploadImage(
    buffer: Buffer,
    originalName: string,
    businessId: string,
    folder: string,
    bucket = 'businesses',
  ): Promise<UploadResult> {
    // Validar extensión
    const ext = extname(originalName).toLowerCase();
    if (!SupabaseStorageService.ALLOWED_IMAGE_EXTS.has(ext)) {
      throw new BadRequestException(
        `Extensión no permitida: "${ext}". Usa: jpg, jpeg, png, webp, gif, avif.`,
      );
    }

    // Validar tamaño
    if (buffer.byteLength > SupabaseStorageService.MAX_IMAGE_SIZE_BYTES) {
      throw new BadRequestException(
        `El archivo supera el límite de 10 MB (${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB).`,
      );
    }

    const fileName = `${randomUUID()}${ext}`;
    const path = `${businessId}/${folder}/${fileName}`;
    const contentType = this.getContentType(ext);

    const { error } = await this.client.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      this.logger.error(`Error al subir imagen a Supabase Storage: ${error.message}`, error);
      throw new InternalServerErrorException(
        `No se pudo subir la imagen al servidor de almacenamiento: ${error.message}`,
      );
    }

    const url = `${this.publicBaseUrl}/${bucket}/${path}`;
    this.logger.log(`Imagen subida exitosamente: ${url}`);
    return { url, path };
  }

  /**
   * Elimina un objeto del bucket por su path relativo.
   * No lanza excepción si el archivo no existe (operación idempotente).
   */
  async deleteFile(path: string, bucket = 'businesses'): Promise<void> {
    const { error } = await this.client.storage.from(bucket).remove([path]);
    if (error) {
      // Solo log; no lanzar excepción para no bloquear operaciones de reemplazo.
      this.logger.warn(
        `No se pudo eliminar el archivo "${path}" del bucket "${bucket}": ${error.message}`,
      );
    } else {
      this.logger.log(`Archivo eliminado de Storage: ${path}`);
    }
  }

  /**
   * Extrae el path relativo de una URL pública de Supabase Storage.
   * Devuelve `null` si la URL no pertenece a este proyecto.
   *
   * Ejemplo:
   *   https://xxx.supabase.co/storage/v1/object/public/businesses/abc/logo/uuid.png
   *   → "abc/logo/uuid.png"
   */
  extractPath(publicUrl: string, bucket = 'businesses'): string | null {
    const prefix = `${this.publicBaseUrl}/${bucket}/`;
    if (!publicUrl.startsWith(prefix)) return null;
    return publicUrl.slice(prefix.length);
  }

  private getContentType(ext: string): string {
    const map: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.avif': 'image/avif',
    };
    return map[ext] ?? 'application/octet-stream';
  }
}
