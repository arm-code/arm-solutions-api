import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { BusinessConfig } from './business-config.entity';

/**
 * Imagen de galería del catálogo público de un negocio.
 * Se muestra en el carrusel del landing público.
 */
@Entity({ name: 'business_gallery_items', schema: 'armsolutions' })
@Index(['configId'])
export class GalleryItem extends BaseEntity {
  @ManyToOne(() => BusinessConfig, (config) => config.gallery, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'config_id' })
  config: BusinessConfig;

  @Column({ name: 'config_id', type: 'uuid' })
  configId: string;

  /** URL pública del objeto en Supabase Storage. */
  @Column({ type: 'text' })
  url: string;

  /** Etiqueta legible, p.ej: "Mesas y sillas". */
  @Column({ type: 'varchar', length: 150, nullable: true })
  label: string | null;

  /** Texto alternativo accesible para la imagen. */
  @Column({ type: 'varchar', length: 255, nullable: true })
  alt: string | null;

  /** Posición en el carrusel (ASC). */
  @Column({ type: 'int', default: 0 })
  order: number;
}
