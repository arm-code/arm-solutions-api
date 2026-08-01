import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { BusinessRole } from '../enums/business-role.enum';
import { Business } from './business.entity';

/**
 * Tabla de unión muchos-a-muchos entre `businesses` y `auth.users`.
 * Define el rol que tiene un usuario dentro de un negocio específico.
 */
@Entity({ name: 'business_users', schema: 'armsolutions' })
@Index(['businessId', 'userId'], { unique: true })
@Index(['userId'])
export class BusinessUser extends BaseEntity {
  @Column({ name: 'business_id', type: 'uuid' })
  businessId: string;

  /**
   * ID del usuario en Supabase Auth (`auth.users.id`).
   * No se mapea como relación ORM porque `auth.users` está en otro schema
   * y no es una entidad TypeORM.
   */
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({
    type: 'enum',
    enum: BusinessRole,
    default: BusinessRole.ADMIN,
  })
  role: BusinessRole;

  @ManyToOne(() => Business, (b) => b.members, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'business_id' })
  business: Business;
}
