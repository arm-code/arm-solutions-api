import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { BusinessConfig } from './business-config.entity';

/**
 * Estadística destacada del negocio para la sección "En números"
 * del landing público. Ejemplos: "+500 eventos", "8 años de experiencia".
 */
@Entity({ name: 'business_stats', schema: 'armsolutions' })
@Index(['configId'])
export class BusinessStat extends BaseEntity {
  @ManyToOne(() => BusinessConfig, (config) => config.stats, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'config_id' })
  config: BusinessConfig;

  @Column({ name: 'config_id', type: 'uuid' })
  configId: string;

  /**
   * Valor legible de la métrica.
   * String libre que puede incluir "+", "%", etc.
   * Ejemplos: "+500", "8+", "100%".
   */
  @Column({ type: 'varchar', length: 50 })
  value: string;

  /** Descripción de la métrica, p.ej: "eventos atendidos". */
  @Column({ type: 'varchar', length: 150 })
  label: string;

  /** Posición en la sección "En números" (ASC). */
  @Column({ type: 'int', default: 0 })
  order: number;
}
