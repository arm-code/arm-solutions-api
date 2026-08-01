import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { InventoryMovementType } from '../enums/inventory-movement-type.enum';
import { InventoryItem } from './inventory-item.entity';
import { InventoryLocation } from './inventory-location.entity';

/**
 * Snapshot del estado del stock antes/después del movimiento.
 * Permite auditoría completa sin necesidad de reconstruir el histórico.
 */
export interface StockSnapshot {
  total: number;
  available: number;
  reserved: number;
  rented: number;
}

@Entity({ name: 'movements_inv', schema: 'armsolutions' })
@Index(['businessId'])
@Index(['ownerId'])
@Index(['itemId'])
@Index(['type'])
@Index(['createdAt'])
export class InventoryMovement extends BaseEntity {
  /** @deprecated Usar businessId para filtros. */
  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  @Index()
  @Column({ name: 'business_id', type: 'uuid' })
  businessId: string;

  @ManyToOne(() => InventoryItem, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'item_id' })
  item: InventoryItem;

  @Column({ name: 'item_id', type: 'uuid' })
  itemId: string;

  @Column({ type: 'enum', enum: InventoryMovementType })
  type: InventoryMovementType;

  /**
   * Cantidad siempre positiva.
   * La dirección (entrada/salida) es inferida por `type`:
   *  - `in`  → incrementa stock
   *  - `out` → decrementa stock
   *  - `transfer` → cambia ubicación (no afecta cantidad total)
   *  - `adjustment` → ajuste directo al stock total
   */
  @Column({ type: 'integer' })
  quantity: number;

  /** Ubicación de origen (requerida para `out` y `transfer`). */
  @ManyToOne(() => InventoryLocation, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'origin_location_id' })
  originLocation: InventoryLocation | null;

  @Column({ name: 'origin_location_id', type: 'uuid', nullable: true })
  originLocationId: string | null;

  /** Ubicación de destino (requerida para `in` y `transfer`). */
  @ManyToOne(() => InventoryLocation, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'destination_location_id' })
  destinationLocation: InventoryLocation | null;

  @Column({ name: 'destination_location_id', type: 'uuid', nullable: true })
  destinationLocationId: string | null;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  /** Estado del stock justo antes de ejecutar este movimiento. */
  @Column({ name: 'snapshot_stock_before', type: 'jsonb' })
  snapshotStockBefore: StockSnapshot;

  /** Estado del stock justo después de ejecutar este movimiento. */
  @Column({ name: 'snapshot_stock_after', type: 'jsonb' })
  snapshotStockAfter: StockSnapshot;
}
