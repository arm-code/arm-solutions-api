import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * Definición de un atributo dinámico de categoría.
 * Se guarda como JSONB en la columna `attributes`.
 */
export interface CategoryAttributeDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  required: boolean;
}

@Entity({ name: 'categories_inv', schema: 'armsolutions' })
@Index(['businessId'])
@Index(['ownerId'])
export class InventoryCategory extends BaseEntity {
  /** @deprecated Usar businessId para filtros. */
  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  @Index()
  @Column({ name: 'business_id', type: 'uuid' })
  businessId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  /** Color hex o nombre CSS para uso en la UI (ej. "#7c3aed"). */
  @Column({ type: 'varchar', length: 30, default: '#6b7280' })
  color: string;

  /**
   * Array de definiciones de atributos dinámicos.
   * Ej: [{ name: "color", type: "string", required: true }]
   */
  @Column({ type: 'jsonb', default: [] })
  attributes: CategoryAttributeDefinition[];

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
