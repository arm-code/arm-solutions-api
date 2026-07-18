import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

/**
 * Evento / proyecto / cliente al que pueden asociarse una o más
 * transacciones (ej. "EVENTO NEGRO TALIBAN").
 *
 * En el Excel original, `ID EVENT/CLIENT` era texto libre repetido en cada
 * fila del movimiento correspondiente. Se normaliza a una entidad propia
 * porque:
 *  1) Un mismo evento genera múltiples transacciones (ingresos y egresos),
 *     y repetir el texto en cada fila viola 2FN/3FN (dependencia parcial +
 *     riesgo de inconsistencia si el nombre se escribe distinto dos veces).
 *  2) Permite reportes por evento (ingresos, gastos y utilidad de UN evento
 *     específico), algo imposible de hacer de forma confiable con texto libre.
 */
@Entity({ name: 'business_events', schema: 'armsolutions' })
@Index(['ownerId', 'name'])
export class BusinessEvent extends BaseEntity {
  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string; // referencia a auth.users(id) de Supabase

  @Column({ type: 'varchar', length: 150 })
  name: string; // p.ej. "EVENTO NEGRO TALIBAN"

  @Column({ name: 'client_name', type: 'varchar', length: 150, nullable: true })
  clientName: string | null;

  @Column({ name: 'event_date', type: 'date', nullable: true })
  eventDate: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => Transaction, (transaction) => transaction.businessEvent)
  transactions: Transaction[];
}
