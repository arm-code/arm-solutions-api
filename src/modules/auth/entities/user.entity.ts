import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * Usuarios del sistema (reemplaza a `auth.users` de Supabase).
 * El email se guarda siempre en minúsculas.
 */
@Entity({ name: 'users', schema: 'armsolutions' })
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  /** Hash bcrypt. `null` = el usuario aún no puede iniciar sesión. */
  @Column({ name: 'password_hash', type: 'varchar', length: 100, nullable: true, select: false })
  passwordHash: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
