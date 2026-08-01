import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { InventoryLocationType } from '../enums/inventory-location-type.enum';

@Entity({ name: 'locations_inv', schema: 'armsolutions' })
@Index(['ownerId'])
export class InventoryLocation extends BaseEntity {
  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'enum', enum: InventoryLocationType })
  type: InventoryLocationType;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
