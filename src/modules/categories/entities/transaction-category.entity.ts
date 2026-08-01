import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

/**
 * Catálogo de categorías de movimientos (RENTA, GASOLINA, COMIDAS, SUELDOS,
 * FLETES, MANTENIMIENTO, ...).
 *
 * Extraída de la columna `CATEGORY` de la hoja `io` por la misma razón que
 * `PaymentMethod`: es un dominio cerrado pero extensible, y normalizarlo
 * evita duplicación y errores de escritura del valor de texto.
 */
@Entity({ name: 'transaction_categories', schema: 'armsolutions' })
@Index(['businessId', 'code'], { unique: true })
export class TransactionCategory extends BaseEntity {
  /** Negocio al que pertenece esta categoría. */
  @Index()
  @Column({ name: 'business_id', type: 'uuid', nullable: true })
  businessId: string | null;

  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => Transaction, (transaction) => transaction.category)
  transactions: Transaction[];
}
