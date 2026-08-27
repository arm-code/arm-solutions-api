// ─── Resultado del procesamiento de archivo ─────────────────────────────────

/**
 * Resultado devuelto por el DownloaderService una vez que yt-dlp
 * ha terminado de procesar la URL.
 */
export interface ProcessedFileResult {
  /** Ruta absoluta al archivo MP3 o ZIP generado. */
  filePath: string;
  /** Nombre limpio del archivo para la cabecera Content-Disposition. */
  fileName: string;
  /** `true` si el resultado es un ZIP (playlist), `false` si es MP3 individual. */
  isZip: boolean;
  /** Directorio temporal que contiene el resultado. Debe limpiarse después del stream. */
  tmpDir: string;
}

// ─── Metadata de un video individual ────────────────────────────────────────

export interface PlaylistEntry {
  /** Título del video / canción. */
  title: string;
  /** Duración en segundos. */
  duration: number | null;
  /** URL del video. */
  url: string;
  /** Canal / autor del video. */
  uploader: string | null;
}

/**
 * Respuesta del endpoint GET /download/info.
 * Incluye metadata básica del video o playlist.
 */
export interface MediaMetadataResponse {
  /** Título del video o playlist. */
  title: string;
  /** Duración total en segundos. `null` para playlists. */
  duration: number | null;
  /** Canal / autor. */
  uploader: string;
  /** URL de la miniatura de máxima calidad disponible. */
  thumbnail: string | null;
  /** `true` si la URL es una playlist de YouTube. */
  isPlaylist: boolean;
  /** Número de entradas si es playlist. */
  entryCount?: number;
  /** Lista de canciones si es playlist (máx 200). */
  entries?: PlaylistEntry[];
}

// ─── Opciones internas de spawn ──────────────────────────────────────────────

/** Opciones para el método interno `spawnYtDlp`. */
export interface SpawnOptions {
  /** Argumentos a pasar al binario yt-dlp. */
  args: string[];
  /** Directorio de trabajo del proceso hijo. */
  cwd: string;
  /** Tiempo máximo de espera en milisegundos. Por defecto 3_600_000 (1h). */
  timeoutMs?: number;
}
