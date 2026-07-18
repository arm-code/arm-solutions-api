import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Campos de auditoría comunes a todas las tablas del dominio de negocio.
 * `id` usa UUID para ser consistente con el esquema `auth.users` de Supabase
 * y evitar exponer IDs secuenciales/adivinables en la API pública.
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
