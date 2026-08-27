import { ApiProperty } from '@nestjs/swagger';
import { IsUrl, Matches } from 'class-validator';

export class GetMediaInfoDto {
  @ApiProperty({
    description:
      'URL completa del video o playlist de YouTube del que se desea obtener información ' +
      'sin descargar el archivo. Soporta videos individuales y playlists completas.',
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
}
