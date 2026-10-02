import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { BusinessConfig } from './business-config.entity';

/**
 * Testimonio/reseña de un cliente para la sección
 * "Lo que dicen nuestros clientes" del landing público.
 */
@Entity({ name: 'business_testimonials', schema: 'armsolutions' })
@Index(['configId'])
export class Testimonial extends BaseEntity {
  @ManyToOne(() => BusinessConfig, (config) => config.testimonials, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'config_id' })
  config: BusinessConfig;

  @Column({ name: 'config_id', type: 'uuid' })
  configId: string;

  /** Texto del testimonio. */
  @Column({ type: 'text' })
  text: string;

  /** Nombre del autor/cliente, p.ej: "María P.". */
  @Column({ type: 'varchar', length: 150 })
  author: string;

  /**
   * Calificación del 1 al 5.
   * El frontend lo usa para renderizar estrellas.
   */
  @Column({ type: 'smallint', default: 5 })
  rating: number;

  /** Posición en la sección de testimonios (ASC). */
  @Column({ type: 'int', default: 0 })
  order: number;
}
