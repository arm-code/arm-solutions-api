import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { BusinessUser } from './business-user.entity';

/**
 * Representa un negocio (tenant) en el sistema.
 * Un usuario puede pertenecer a múltiples negocios a través de `business_users`.
 */
@Entity({ name: 'businesses', schema: 'armsolutions' })
@Index(['slug'], { unique: true })
export class Business extends BaseEntity {
  /** Nombre visible del negocio. */
  @Column({ type: 'varchar', length: 150 })
  name: string;

  /**
   * Identificador URL-amigable único. Generado automáticamente si no se provee.
   * Ej: "eventos-mendoza", "papeleria-lopez"
   */
  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  /**
   * URL del logotipo del negocio.
   * Pensado para Supabase Storage: `businesses/<id>/logo.png`
   */
  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => BusinessUser, (bu) => bu.business, {
    cascade: false,
    eager: false,
  })
  members: BusinessUser[];
}
