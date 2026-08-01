import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { InventoryItemStatus } from '../enums/inventory-item-status.enum';
import { InventoryItemType } from '../enums/inventory-item-type.enum';
import { InventoryCategory } from './inventory-category.entity';
import { InventoryItemSerial } from './inventory-item-serial.entity';
import { InventoryLocation } from './inventory-location.entity';

@Entity({ name: 'items_inv', schema: 'armsolutions' })
@Index(['ownerId'])
@Index(['ownerId', 'sku'], { unique: true })
@Index(['categoryId'])
@Index(['status'])
@Index(['type'])
export class InventoryItem extends BaseEntity {
  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  /** Código de identificación único por negocio (owner). */
  @Column({ type: 'varchar', length: 100 })
  sku: string;

  @Column({ type: 'enum', enum: InventoryItemType })
  type: InventoryItemType;

  @Column({
    type: 'enum',
    enum: InventoryItemStatus,
    default: InventoryItemStatus.AVAILABLE,
  })
  status: InventoryItemStatus;

  @ManyToOne(() => InventoryCategory, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'category_id' })
  category: InventoryCategory;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => InventoryLocation, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'location_id' })
  location: InventoryLocation | null;

  @Column({ name: 'location_id', type: 'uuid', nullable: true })
  locationId: string | null;

  @Column({
    name: 'rent_price',
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  rentPrice: string | null;

  @Column({
    name: 'sale_price',
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  salePrice: string | null;

  // ── Stock ──────────────────────────────────────────────────────────────────

  /** Unidades totales registradas en el sistema. */
  @Column({ name: 'stock_total', type: 'integer', default: 0 })
  stockTotal: number;

  /** Unidades disponibles para asignar (total - reserved - rented). */
  @Column({ name: 'stock_available', type: 'integer', default: 0 })
  stockAvailable: number;

  /** Unidades reservadas (separadas en una nota sin cerrar). */
  @Column({ name: 'stock_reserved', type: 'integer', default: 0 })
  stockReserved: number;

  /** Unidades actualmente en renta/uso activo. */
  @Column({ name: 'stock_rented', type: 'integer', default: 0 })
  stockRented: number;

  // ── Atributos dinámicos ────────────────────────────────────────────────────

  /**
   * Diccionario clave-valor con los atributos propios de la categoría.
   * Ej: { "color": "rojo", "material": "aluminio" }
   */
  @Column({ type: 'jsonb', default: {} })
  attributes: Record<string, unknown>;

  /** Soft-delete: nunca se borra físicamente para preservar historiales. */
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => InventoryItemSerial, (serial) => serial.item, {
    cascade: false,
    eager: false,
  })
  serials: InventoryItemSerial[];
}
