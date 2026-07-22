import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { BusinessEvent } from '../../events/entities/business-event.entity';
import { SalesNoteStatus } from '../enums/sales-note-status.enum';
import { SalesNoteItem } from './sales-note-item.entity';

@Entity({ name: 'sales_notes', schema: 'armsolutions' })
@Index(['ownerId'])
@Index(['status'])
@Index(['eventId'])
export class SalesNote extends BaseEntity {
  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  @Column({ name: 'folio_number', type: 'integer', insert: false })
  folioNumber: number;

  @Column({
    type: 'enum',
    enum: SalesNoteStatus,
    default: SalesNoteStatus.NOTE,
  })
  status: SalesNoteStatus;

  @Column({ name: 'customer_name', type: 'varchar', length: 150 })
  customerName: string;

  @Column({ name: 'customer_phone', type: 'varchar', length: 30, nullable: true })
  customerPhone: string | null;

  @Column({ name: 'customer_address', type: 'varchar', length: 255, nullable: true })
  customerAddress: string | null;

  @Column({ name: 'customer_email', type: 'varchar', length: 150, nullable: true })
  customerEmail: string | null;

  @Column({ name: 'apply_iva', type: 'boolean', default: false })
  applyIva: boolean;

  @Column({ name: 'iva_rate', type: 'numeric', precision: 5, scale: 4, default: 0.16 })
  ivaRate: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  subtotal: string;

  @Column({ name: 'iva_amount', type: 'numeric', precision: 12, scale: 2, default: 0 })
  ivaAmount: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  total: string;

  @ManyToOne(() => BusinessEvent, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: false,
  })
  @JoinColumn({ name: 'event_id' })
  event: BusinessEvent | null;

  @Column({ name: 'event_id', type: 'uuid', nullable: true })
  eventId: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => SalesNoteItem, (item) => item.note, {
    cascade: true,
    eager: true,
  })
  items: SalesNoteItem[];

  /** Folio dinámico: COT-0001 si es Cotización, NV-0001 si es Nota de Venta. */
  get folio(): string {
    if (!this.folioNumber) return '';
    const prefix = this.status === SalesNoteStatus.QUOTE ? 'COT' : 'NV';
    return `${prefix}-${String(this.folioNumber).padStart(4, '0')}`;
  }
}
