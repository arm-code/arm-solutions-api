import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
} from 'class-validator';

export class DownloadAudioDto {
  @ApiProperty({
    description:
      'URL completa del video o playlist de YouTube a descargar. Soporta URLs de youtube.com y youtu.be.',
    example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  })
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'La URL proporcionada no es válida. Debe comenzar con http:// o https://.' },
  )
  @Matches(
    /^https?:\/\/(www\.)?(youtube\.com|youtu\.be|music\.youtube\.com)\/.+/,
    { message: 'Solo se aceptan URLs de YouTube (youtube.com, youtu.be, music.youtube.com).' },
  )
  url: string;

  @ApiProperty({
    description:
      'Indica si la URL corresponde a una playlist completa de YouTube. ' +
      'Si es `true`, se descarga toda la playlist y se retorna un archivo `.zip`. ' +
      'Si es `false`, se descarga únicamente el video indicado y se retorna un `.mp3`.',
    example: false,
  })
  @IsBoolean({ message: 'El campo "isPlaylist" debe ser un valor booleano (true/false).' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isPlaylist: boolean;

  @ApiPropertyOptional({
    description:
      'Calidad de audio VBR para MP3. Va de "0" (mejor calidad, ~320kbps) a "9" (menor calidad). ' +
      'Por defecto se usa "0" para máxima calidad.',
    example: '0',
    enum: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
    default: '0',
  })
  @IsOptional()
  @IsString()
  @IsIn(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'], {
    message: 'La calidad de audio debe estar entre "0" (mejor) y "9" (peor).',
  })
  audioQuality?: string = '0';

  @ApiPropertyOptional({
    description:
      'Si es `true`, incrusta la miniatura del video como carátula del archivo MP3 (etiqueta ID3). ' +
      'Por defecto es `true`.',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  embedThumbnail?: boolean = true;

  @ApiPropertyOptional({
    description:
      'Si es `true`, incrusta los metadatos del video (título, artista, álbum, año) en el archivo MP3. ' +
      'Por defecto es `true`.',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  embedMetadata?: boolean = true;
}
