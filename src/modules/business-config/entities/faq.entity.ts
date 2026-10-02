import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { BusinessConfig } from './business-config.entity';

/**
 * Pregunta frecuente configurable por el negocio.
 * Se muestra en la sección FAQ del landing público.
 */
@Entity({ name: 'business_faqs', schema: 'armsolutions' })
@Index(['configId'])
export class Faq extends BaseEntity {
  @ManyToOne(() => BusinessConfig, (config) => config.faqs, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'config_id' })
  config: BusinessConfig;

  @Column({ name: 'config_id', type: 'uuid' })
  configId: string;

  /** Pregunta del cliente. */
  @Column({ type: 'text' })
  question: string;

  /** Respuesta del negocio. */
  @Column({ type: 'text' })
  answer: string;

  /** Posición en la sección FAQ (ASC). */
  @Column({ type: 'int', default: 0 })
  order: number;
}
