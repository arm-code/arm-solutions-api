import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { InventoryItemStatus } from '../enums/inventory-item-status.enum';
import { InventoryItem } from './inventory-item.entity';

/** Serial individual de un ítem del tipo `serialized`. */
@Entity({ name: 'item_serials_inv', schema: 'armsolutions' })
@Index(['itemId'])
export class InventoryItemSerial extends BaseEntity {
  @ManyToOne(() => InventoryItem, (item) => item.serials, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'item_id' })
  item: InventoryItem;

  @Column({ name: 'item_id', type: 'uuid' })
  itemId: string;

  @Column({ name: 'serial_number', type: 'varchar', length: 200 })
  serialNumber: string;

  @Column({
    type: 'enum',
    enum: InventoryItemStatus,
    default: InventoryItemStatus.AVAILABLE,
  })
  status: InventoryItemStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
