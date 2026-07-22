import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { EventStatus } from '../enums/event-status.enum';

/**
 * Evento / proyecto / servicio de alquiler de mobiliario
 * al que pueden asociarse una o más transacciones.
 */
@Entity({ name: 'business_events', schema: 'armsolutions' })
@Index(['ownerId', 'name'])
@Index(['ownerId', 'folioNumber'])
export class BusinessEvent extends BaseEntity {
  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string; // referencia a auth.users(id) de Supabase

  @Column({ name: 'folio_number', type: 'integer', insert: false })
  folioNumber: number;

  @Column({ type: 'varchar', length: 150 })
  name: string; // p.ej. "Renta Mobiliario Cumpleaños"

  @Column({ name: 'client_name', type: 'varchar', length: 150, nullable: true })
  clientName: string | null;

  @Column({ name: 'client_phone', type: 'varchar', length: 30, nullable: true })
  clientPhone: string | null;

  @Column({ name: 'event_address', type: 'varchar', length: 255, nullable: true })
  eventAddress: string | null;

  @Column({ name: 'event_date', type: 'date', nullable: true })
  eventDate: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  cost: string; // numeric se mapea como string en TypeORM

  @Column({
    type: 'enum',
    enum: EventStatus,
    default: EventStatus.PENDING,
  })
  status: EventStatus;

  @Column({ name: 'guarantee_document', type: 'varchar', length: 150, nullable: true })
  guaranteeDocument: string | null;

  @Column({ name: 'note_id', type: 'uuid', nullable: true })
  noteId: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => Transaction, (transaction) => transaction.businessEvent)
  transactions: Transaction[];

  /** Folio legible construido a partir de `folioNumber`, ej. "EV-0001". */
  get folio(): string {
    if (!this.folioNumber) return '';
    return `EV-${String(this.folioNumber).padStart(4, '0')}`;
  }
}

