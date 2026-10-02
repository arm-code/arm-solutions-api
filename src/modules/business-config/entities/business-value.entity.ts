import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { BusinessConfig } from './business-config.entity';

/**
 * Valor corporativo que el negocio comunica en su landing público.
 * Ejemplos: "Responsabilidad", "Higiene", "Trato humano".
 */
@Entity({ name: 'business_values', schema: 'armsolutions' })
@Index(['configId'])
export class BusinessValue extends BaseEntity {
  @ManyToOne(() => BusinessConfig, (config) => config.values, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'config_id' })
  config: BusinessConfig;

  @Column({ name: 'config_id', type: 'uuid' })
  configId: string;

  /** Nombre del valor, p.ej: "Responsabilidad". */
  @Column({ type: 'varchar', length: 150 })
  title: string;

  /** Descripción breve del valor. */
  @Column({ type: 'text', nullable: true })
  description: string | null;

  /**
   * Nombre de ícono de lucide-react, p.ej: "clock", "shield", "users".
   * Es un string libre; el frontend lo resuelve al componente correcto.
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  icon: string | null;

  /** Posición en la sección "Nuestros valores" (ASC). */
  @Column({ type: 'int', default: 0 })
  order: number;
}
