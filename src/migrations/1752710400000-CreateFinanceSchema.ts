import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Esquema inicial del módulo financiero (ex-hoja de cálculo `business.xlsx`).
 *
 * Todas las entidades se crean dentro del schema "armsolutions" para evitar
 * colisiones con otros proyectos que comparten el mismo proyecto de Supabase.
 *
 * Entidades creadas (normalizadas a 3FN):
 *   - armsolutions.payment_methods        (catálogo)
 *   - armsolutions.transaction_categories (catálogo)
 *   - armsolutions.business_events        (eventos/clientes)
 *   - armsolutions.transactions           (tabla de hechos, FK a las 3 anteriores)
 *
 * Además:
 *   - Enum nativo `armsolutions.transactions_type_enum` (INPUT/OUTPUT).
 *   - Secuencia `armsolutions.transactions_folio_seq` para folios consecutivos.
 *   - Row Level Security (RLS) para aislar los datos por usuario de Supabase.
 *   - Seed de catálogos con los valores encontrados en el Excel original.
 */
export class CreateFinanceSchema1752710400000 implements MigrationInterface {
  name = 'CreateFinanceSchema1752710400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Extensión necesaria para gen_random_uuid()
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    // Aseguramos que el schema exista (por si acaso)
    await queryRunner.query(
      `CREATE SCHEMA IF NOT EXISTS "armsolutions";`,
    );

    // ---------- Enum de tipo de transacción ----------
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "armsolutions"."transactions_type_enum" AS ENUM ('INPUT', 'OUTPUT');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // ---------- payment_methods ----------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "armsolutions"."payment_methods" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "code" varchar(30) NOT NULL,
        "name" varchar(100) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payment_methods" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_payment_methods_code" UNIQUE ("code")
      );
    `);

    // ---------- transaction_categories ----------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "armsolutions"."transaction_categories" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "code" varchar(50) NOT NULL,
        "name" varchar(100) NOT NULL,
        "description" varchar(255),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transaction_categories" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_transaction_categories_code" UNIQUE ("code")
      );
    `);

    // ---------- business_events ----------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "armsolutions"."business_events" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "owner_id" uuid NOT NULL,
        "name" varchar(150) NOT NULL,
        "client_name" varchar(150),
        "event_date" date,
        "notes" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_business_events" PRIMARY KEY ("id"),
        CONSTRAINT "FK_business_events_owner" FOREIGN KEY ("owner_id")
          REFERENCES "auth"."users" ("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_business_events_owner_name"
        ON "armsolutions"."business_events" ("owner_id", "name");
    `);

    // ---------- secuencia de folios ----------
    await queryRunner.query(
      `CREATE SEQUENCE IF NOT EXISTS "armsolutions"."transactions_folio_seq" START WITH 1;`,
    );

    // ---------- transactions ----------
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "armsolutions"."transactions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "owner_id" uuid NOT NULL,
        "folio_number" integer NOT NULL DEFAULT nextval('"armsolutions"."transactions_folio_seq"'),
        "transaction_date" date NOT NULL,
        "type" "armsolutions"."transactions_type_enum" NOT NULL,
        "description" varchar(255),
        "amount" numeric(12,2) NOT NULL,
        "category_id" uuid NOT NULL,
        "payment_method_id" uuid NOT NULL,
        "business_event_id" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transactions" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_transactions_amount_positive" CHECK ("amount" > 0),
        CONSTRAINT "FK_transactions_owner" FOREIGN KEY ("owner_id")
          REFERENCES "auth"."users" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_transactions_category" FOREIGN KEY ("category_id")
          REFERENCES "armsolutions"."transaction_categories" ("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_transactions_payment_method" FOREIGN KEY ("payment_method_id")
          REFERENCES "armsolutions"."payment_methods" ("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_transactions_business_event" FOREIGN KEY ("business_event_id")
          REFERENCES "armsolutions"."business_events" ("id") ON DELETE SET NULL
      );
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_transactions_owner_folio"
        ON "armsolutions"."transactions" ("owner_id", "folio_number");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_transactions_owner_date"
        ON "armsolutions"."transactions" ("owner_id", "transaction_date");`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_transactions_owner_type"
        ON "armsolutions"."transactions" ("owner_id", "type");`,
    );

    // ---------- Row Level Security ----------
    for (const table of ['business_events', 'transactions']) {
      await queryRunner.query(
        `ALTER TABLE "armsolutions"."${table}" ENABLE ROW LEVEL SECURITY;`,
      );
      await queryRunner.query(`
        DO $$ BEGIN
          CREATE POLICY "owner_can_manage_${table}" ON "armsolutions"."${table}"
          USING (owner_id = auth.uid())
          WITH CHECK (owner_id = auth.uid());
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
      `);
    }
    // Catálogos: lectura para usuarios autenticados, escritura solo service_role
    for (const table of ['payment_methods', 'transaction_categories']) {
      await queryRunner.query(
        `ALTER TABLE "armsolutions"."${table}" ENABLE ROW LEVEL SECURITY;`,
      );
      await queryRunner.query(`
        DO $$ BEGIN
          CREATE POLICY "authenticated_can_read_${table}" ON "armsolutions"."${table}"
          FOR SELECT
          USING (auth.role() = 'authenticated');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
      `);
    }

    // ---------- Seed de catálogos ----------
    await queryRunner.query(`
      INSERT INTO "armsolutions"."payment_methods" ("code", "name") VALUES
        ('CASH', 'Efectivo'),
        ('TRANSFER', 'Transferencia')
      ON CONFLICT ("code") DO NOTHING;
    `);
    await queryRunner.query(`
      INSERT INTO "armsolutions"."transaction_categories" ("code", "name") VALUES
        ('RENTA', 'Renta de mobiliario/equipo'),
        ('GASOLINA', 'Gasolina'),
        ('COMIDAS', 'Comidas'),
        ('SUELDOS', 'Sueldos'),
        ('FLETES', 'Fletes'),
        ('MANTENIMIENTO', 'Mantenimiento')
      ON CONFLICT ("code") DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "armsolutions"."transactions" CASCADE;`,
    );
    await queryRunner.query(
      `DROP SEQUENCE IF EXISTS "armsolutions"."transactions_folio_seq";`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "armsolutions"."business_events" CASCADE;`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "armsolutions"."transaction_categories" CASCADE;`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "armsolutions"."payment_methods" CASCADE;`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "armsolutions"."transactions_type_enum";`,
    );
  }
}
