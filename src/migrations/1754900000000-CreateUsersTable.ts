import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fase 3: usuarios propios en lugar de `auth.users` de Supabase.
 *  - Crea `armsolutions.users` y copia id + email de `auth.users` (si existe).
 *    Los hashes de contraseña se importan aparte (scripts/import-users-from-supabase.sh).
 *  - Apunta `business_users.user_id` a la nueva tabla.
 */
export class CreateUsersTable1754900000000 implements MigrationInterface {
  name = 'CreateUsersTable1754900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE armsolutions.users (
        id            uuid         NOT NULL DEFAULT gen_random_uuid(),
        email         varchar(255) NOT NULL,
        password_hash varchar(100),
        is_active     boolean      NOT NULL DEFAULT true,
        created_at    timestamptz  NOT NULL DEFAULT now(),
        updated_at    timestamptz  NOT NULL DEFAULT now(),
        CONSTRAINT pk_users PRIMARY KEY (id),
        CONSTRAINT uq_users_email UNIQUE (email),
        CONSTRAINT ck_users_email_lower CHECK (email = lower(email))
      )
    `);

    await queryRunner.query(`
      DO $$
      DECLARE c record;
      BEGIN
        IF to_regclass('auth.users') IS NOT NULL THEN
          INSERT INTO armsolutions.users (id, email)
            SELECT id, lower(email) FROM auth.users WHERE email IS NOT NULL
            ON CONFLICT DO NOTHING;

          FOR c IN
            SELECT conname FROM pg_constraint
            WHERE conrelid = 'armsolutions.business_users'::regclass
              AND contype = 'f' AND confrelid = 'auth.users'::regclass
          LOOP
            EXECUTE format('ALTER TABLE armsolutions.business_users DROP CONSTRAINT %I', c.conname);
          END LOOP;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE armsolutions.business_users
        ADD CONSTRAINT fk_business_users_user
        FOREIGN KEY (user_id) REFERENCES armsolutions.users (id) ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE armsolutions.business_users DROP CONSTRAINT IF EXISTS fk_business_users_user`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS armsolutions.users`);
  }
}
