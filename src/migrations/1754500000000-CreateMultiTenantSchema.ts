import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración: Arquitectura Multi-Tenant (Multi-Negocio)
 *
 * Pasos ejecutados en orden:
 *   1. Enum `business_user_role_enum`
 *   2. Tabla `businesses`
 *   3. Tabla `business_users`
 *   4. Agregar columna `business_id` (nullable) a todas las tablas de negocio
 *   5. Backfill: crear un negocio por cada owner_id histórico y asignar business_id
 *   6. Convertir business_id en NOT NULL
 *   7. Índices de performance en business_id
 *   8. Actualizar RLS policies para filtrar por business_id
 *
 * Tablas afectadas:
 *   - armsolutions.business_events
 *   - armsolutions.transactions
 *   - armsolutions.business_configs
 *   - armsolutions.locations_inv
 *   - armsolutions.categories_inv
 *   - armsolutions.items_inv
 *   - armsolutions.movements_inv
 *   - armsolutions.payment_methods
 *   - armsolutions.transaction_categories
 */
export class CreateMultiTenantSchema1754500000000 implements MigrationInterface {
  name = 'CreateMultiTenantSchema1754500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. Enum de roles ──────────────────────────────────────────────────────

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE armsolutions.business_user_role_enum
          AS ENUM ('admin', 'editor', 'viewer');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    // ── 2. Tabla businesses ───────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS armsolutions.businesses (
        id         UUID         NOT NULL DEFAULT gen_random_uuid(),
        name       VARCHAR(150) NOT NULL,
        slug       VARCHAR(100) NOT NULL,
        logo_url   TEXT,
        is_active  BOOLEAN      NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_businesses" PRIMARY KEY (id),
        CONSTRAINT "UQ_businesses_slug" UNIQUE (slug)
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_businesses_slug"
        ON armsolutions.businesses (slug);
    `);

    // ── 3. Tabla business_users ───────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS armsolutions.business_users (
        id          UUID         NOT NULL DEFAULT gen_random_uuid(),
        business_id UUID         NOT NULL,
        user_id     UUID         NOT NULL,
        role        armsolutions.business_user_role_enum NOT NULL DEFAULT 'admin',
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
        updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_business_users" PRIMARY KEY (id),
        CONSTRAINT "UQ_business_users_business_user" UNIQUE (business_id, user_id),
        CONSTRAINT "FK_business_users_business"
          FOREIGN KEY (business_id)
          REFERENCES armsolutions.businesses (id)
          ON DELETE CASCADE,
        CONSTRAINT "FK_business_users_user"
          FOREIGN KEY (user_id)
          REFERENCES auth.users (id)
          ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_business_users_user_id"
        ON armsolutions.business_users (user_id);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_business_users_business_id"
        ON armsolutions.business_users (business_id);
    `);

    // ── 4. Agregar business_id (nullable) a tablas de negocio ─────────────────

    // business_events
    await queryRunner.query(`
      ALTER TABLE armsolutions.business_events
        ADD COLUMN IF NOT EXISTS business_id UUID;
    `);

    // transactions
    await queryRunner.query(`
      ALTER TABLE armsolutions.transactions
        ADD COLUMN IF NOT EXISTS business_id UUID;
    `);

    // business_configs
    await queryRunner.query(`
      ALTER TABLE armsolutions.business_configs
        ADD COLUMN IF NOT EXISTS business_id UUID;
    `);

    // payment_methods (pasa a ser por-negocio)
    await queryRunner.query(`
      ALTER TABLE armsolutions.payment_methods
        ADD COLUMN IF NOT EXISTS business_id UUID;
    `);

    // transaction_categories (pasa a ser por-negocio)
    await queryRunner.query(`
      ALTER TABLE armsolutions.transaction_categories
        ADD COLUMN IF NOT EXISTS business_id UUID;
    `);

    // inventory tables
    await queryRunner.query(`
      ALTER TABLE armsolutions.locations_inv
        ADD COLUMN IF NOT EXISTS business_id UUID;
    `);

    await queryRunner.query(`
      ALTER TABLE armsolutions.categories_inv
        ADD COLUMN IF NOT EXISTS business_id UUID;
    `);

    await queryRunner.query(`
      ALTER TABLE armsolutions.items_inv
        ADD COLUMN IF NOT EXISTS business_id UUID;
    `);

    await queryRunner.query(`
      ALTER TABLE armsolutions.movements_inv
        ADD COLUMN IF NOT EXISTS business_id UUID;
    `);

    // ── 5. Backfill de datos históricos ───────────────────────────────────────

    /**
     * Por cada owner_id único encontrado en business_events y transactions:
     *   a) Crear un negocio default en businesses
     *   b) Registrar al owner como admin en business_users
     *   c) Actualizar business_id en todas las tablas usando owner_id
     *
     * Los catálogos globales (payment_methods, transaction_categories) que ya
     * existen se asignarán a un sentinel NULL business_id inicialmente y se
     * migrarán por negocio en la migración de seeds que sigue.
     */
    await queryRunner.query(`
      DO $$
      DECLARE
        rec RECORD;
        new_business_id UUID;
        safe_slug VARCHAR(100);
        slug_suffix INT := 0;
        candidate_slug VARCHAR(100);
      BEGIN
        -- Recolectar owner_ids únicos de tablas con datos reales
        FOR rec IN
          SELECT DISTINCT owner_id
          FROM (
            SELECT owner_id FROM armsolutions.business_events
            UNION
            SELECT owner_id FROM armsolutions.transactions
          ) AS all_owners
        LOOP
          -- Generar slug único basado en UUID del usuario
          safe_slug := 'negocio-' || LEFT(rec.owner_id::text, 8);
          candidate_slug := safe_slug;

          -- Asegurar unicidad del slug
          WHILE EXISTS (
            SELECT 1 FROM armsolutions.businesses WHERE slug = candidate_slug
          ) LOOP
            slug_suffix := slug_suffix + 1;
            candidate_slug := safe_slug || '-' || slug_suffix;
          END LOOP;

          -- Insertar negocio default
          INSERT INTO armsolutions.businesses (name, slug)
          VALUES ('Mi Negocio', candidate_slug)
          RETURNING id INTO new_business_id;

          -- Registrar owner como admin
          INSERT INTO armsolutions.business_users (business_id, user_id, role)
          VALUES (new_business_id, rec.owner_id, 'admin');

          -- Actualizar business_id en todas las tablas por owner_id
          UPDATE armsolutions.business_events
            SET business_id = new_business_id
            WHERE owner_id = rec.owner_id AND business_id IS NULL;

          UPDATE armsolutions.transactions
            SET business_id = new_business_id
            WHERE owner_id = rec.owner_id AND business_id IS NULL;

          -- inventory (usa owner_id también)
          UPDATE armsolutions.locations_inv
            SET business_id = new_business_id
            WHERE owner_id = rec.owner_id AND business_id IS NULL;

          UPDATE armsolutions.categories_inv
            SET business_id = new_business_id
            WHERE owner_id = rec.owner_id AND business_id IS NULL;

          UPDATE armsolutions.items_inv
            SET business_id = new_business_id
            WHERE owner_id = rec.owner_id AND business_id IS NULL;

          UPDATE armsolutions.movements_inv
            SET business_id = new_business_id
            WHERE owner_id = rec.owner_id AND business_id IS NULL;

        END LOOP;

        -- business_configs: asignar al primer negocio encontrado si existe
        UPDATE armsolutions.business_configs
          SET business_id = (SELECT id FROM armsolutions.businesses LIMIT 1)
          WHERE business_id IS NULL;

      END $$;
    `);

    // ── 6. Convertir business_id en NOT NULL (post-backfill) ──────────────────
    // Solo en tablas que tienen datos de negocio verdaderos
    // (business_configs puede quedar nullable si no había config previa)

    await queryRunner.query(`
      ALTER TABLE armsolutions.business_events
        ALTER COLUMN business_id SET NOT NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE armsolutions.transactions
        ALTER COLUMN business_id SET NOT NULL;
    `);

    // inventory: NOT NULL condicional — solo si todos los registros ya tienen business_id
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM armsolutions.locations_inv WHERE business_id IS NULL
        ) THEN
          ALTER TABLE armsolutions.locations_inv
            ALTER COLUMN business_id SET NOT NULL;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM armsolutions.categories_inv WHERE business_id IS NULL
        ) THEN
          ALTER TABLE armsolutions.categories_inv
            ALTER COLUMN business_id SET NOT NULL;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM armsolutions.items_inv WHERE business_id IS NULL
        ) THEN
          ALTER TABLE armsolutions.items_inv
            ALTER COLUMN business_id SET NOT NULL;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM armsolutions.movements_inv WHERE business_id IS NULL
        ) THEN
          ALTER TABLE armsolutions.movements_inv
            ALTER COLUMN business_id SET NOT NULL;
        END IF;
      END $$;
    `);

    // ── 7. FK constraints en business_id ─────────────────────────────────────

    await queryRunner.query(`
      ALTER TABLE armsolutions.business_events
        ADD CONSTRAINT "FK_business_events_business"
          FOREIGN KEY (business_id)
          REFERENCES armsolutions.businesses (id)
          ON DELETE CASCADE;
    `);

    await queryRunner.query(`
      ALTER TABLE armsolutions.transactions
        ADD CONSTRAINT "FK_transactions_business"
          FOREIGN KEY (business_id)
          REFERENCES armsolutions.businesses (id)
          ON DELETE CASCADE;
    `);

    for (const table of ['locations_inv', 'categories_inv', 'items_inv', 'movements_inv']) {
      await queryRunner.query(`
        ALTER TABLE armsolutions.${table}
          ADD CONSTRAINT "FK_${table}_business"
            FOREIGN KEY (business_id)
            REFERENCES armsolutions.businesses (id)
            ON DELETE CASCADE;
      `);
    }

    for (const table of ['payment_methods', 'transaction_categories']) {
      await queryRunner.query(`
        ALTER TABLE armsolutions.${table}
          ADD CONSTRAINT "FK_${table}_business"
            FOREIGN KEY (business_id)
            REFERENCES armsolutions.businesses (id)
            ON DELETE CASCADE;
      `);
    }

    // ── 8. Índices de performance en business_id ──────────────────────────────

    for (const table of [
      'business_events',
      'transactions',
      'locations_inv',
      'categories_inv',
      'items_inv',
      'movements_inv',
      'payment_methods',
      'transaction_categories',
    ]) {
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IDX_${table}_business_id"
          ON armsolutions.${table} (business_id);
      `);
    }

    // ── 9. Actualizar RLS policies ────────────────────────────────────────────

    /**
     * Reemplazamos las políticas basadas en auth.uid() (owner_id) por
     * políticas basadas en app.current_business_id.
     * El backend setea esta variable por cada request via TenantGuard.
     *
     * Mantenemos la política por owner_id para business_users y businesses
     * para que el endpoint GET /businesses siga funcionando.
     */

    // Eliminar políticas viejas basadas en owner_id
    for (const table of ['business_events', 'transactions']) {
      await queryRunner.query(`
        DO $$ BEGIN
          DROP POLICY IF EXISTS "owner_can_manage_${table}" ON armsolutions.${table};
        EXCEPTION WHEN OTHERS THEN NULL; END $$;
      `);
    }

    // Crear función helper para setear el business_id de la sesión
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION armsolutions.set_current_business(p_business_id UUID)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        PERFORM set_config('app.current_business_id', p_business_id::text, true);
      END;
      $$;
    `);

    // Nuevas políticas RLS basadas en business_id
    for (const table of [
      'business_events',
      'transactions',
      'locations_inv',
      'categories_inv',
      'items_inv',
      'movements_inv',
      'payment_methods',
      'transaction_categories',
    ]) {
      await queryRunner.query(`
        ALTER TABLE armsolutions.${table} ENABLE ROW LEVEL SECURITY;
      `);

      await queryRunner.query(`
        DO $$ BEGIN
          CREATE POLICY "tenant_isolation_${table}" ON armsolutions.${table}
          FOR ALL
          USING (
            business_id = NULLIF(
              current_setting('app.current_business_id', true), ''
            )::uuid
          )
          WITH CHECK (
            business_id = NULLIF(
              current_setting('app.current_business_id', true), ''
            )::uuid
          );
        EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      `);
    }

    // businesses y business_users: visibles para el usuario autenticado
    await queryRunner.query(`
      ALTER TABLE armsolutions.businesses ENABLE ROW LEVEL SECURITY;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE POLICY "user_can_see_own_businesses" ON armsolutions.businesses
        FOR SELECT
        USING (
          id IN (
            SELECT business_id FROM armsolutions.business_users
            WHERE user_id = auth.uid()
          )
        );
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE armsolutions.business_users ENABLE ROW LEVEL SECURITY;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE POLICY "user_can_see_own_memberships" ON armsolutions.business_users
        FOR SELECT
        USING (user_id = auth.uid());
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar políticas RLS nuevas
    for (const table of [
      'business_events', 'transactions', 'locations_inv', 'categories_inv',
      'items_inv', 'movements_inv', 'payment_methods', 'transaction_categories',
    ]) {
      await queryRunner.query(
        `DROP POLICY IF EXISTS "tenant_isolation_${table}" ON armsolutions.${table};`,
      );
    }
    await queryRunner.query(
      `DROP POLICY IF EXISTS "user_can_see_own_businesses" ON armsolutions.businesses;`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS "user_can_see_own_memberships" ON armsolutions.business_users;`,
    );

    // Eliminar FK constraints
    for (const table of ['locations_inv', 'categories_inv', 'items_inv', 'movements_inv']) {
      await queryRunner.query(
        `ALTER TABLE armsolutions.${table} DROP CONSTRAINT IF EXISTS "FK_${table}_business";`,
      );
    }
    for (const table of ['payment_methods', 'transaction_categories']) {
      await queryRunner.query(
        `ALTER TABLE armsolutions.${table} DROP CONSTRAINT IF EXISTS "FK_${table}_business";`,
      );
    }
    await queryRunner.query(
      `ALTER TABLE armsolutions.business_events DROP CONSTRAINT IF EXISTS "FK_business_events_business";`,
    );
    await queryRunner.query(
      `ALTER TABLE armsolutions.transactions DROP CONSTRAINT IF EXISTS "FK_transactions_business";`,
    );

    // Eliminar columnas business_id
    for (const table of [
      'business_events', 'transactions', 'business_configs',
      'locations_inv', 'categories_inv', 'items_inv', 'movements_inv',
      'payment_methods', 'transaction_categories',
    ]) {
      await queryRunner.query(
        `ALTER TABLE armsolutions.${table} DROP COLUMN IF EXISTS business_id;`,
      );
    }

    // Eliminar función helper
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS armsolutions.set_current_business(UUID);`,
    );

    // Eliminar tablas
    await queryRunner.query(`DROP TABLE IF EXISTS armsolutions.business_users CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS armsolutions.businesses CASCADE;`);
    await queryRunner.query(`DROP TYPE IF EXISTS armsolutions.business_user_role_enum;`);
  }
}
