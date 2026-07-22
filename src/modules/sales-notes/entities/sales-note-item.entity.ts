import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { SalesNote } from './sales-note.entity';

@Entity({ name: 'sales_note_items', schema: 'armsolutions' })
@Index(['noteId'])
export class SalesNoteItem extends BaseEntity {
  @ManyToOne(() => SalesNote, (note) => note.items, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'note_id' })
  note: SalesNote;

  @Column({ name: 'note_id', type: 'uuid' })
  noteId: string;

  @Column({ type: 'varchar', length: 255 })
  concept: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, default: 1 })
  quantity: string;

  @Column({ name: 'unit_price', type: 'numeric', precision: 12, scale: 2, default: 0 })
  unitPrice: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  amount: string;
}
