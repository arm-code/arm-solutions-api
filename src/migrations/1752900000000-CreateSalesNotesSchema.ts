import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración para crear el módulo de Notas de Venta y Cotizaciones:
 * - Secuencia `sales_notes_folio_seq`.
 * - Enum `sales_notes_status_enum` ('quote', 'note').
 * - Tabla `sales_notes` (cabecera) y `sales_note_items` (detalle).
 */
export class CreateSalesNotesSchema1752900000000 implements MigrationInterface {
  name = 'CreateSalesNotesSchema1752900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Secuencia de folios
    await queryRunner.query(
      `CREATE SEQUENCE IF NOT EXISTS "armsolutions"."sales_notes_folio_seq" START WITH 1;`,
    );

    // 2. Enum status
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "armsolutions"."sales_notes_status_enum" AS ENUM ('quote', 'note');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // 3. Tabla sales_notes
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "armsolutions"."sales_notes" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "owner_id" uuid NOT NULL,
        "folio_number" integer NOT NULL DEFAULT nextval('"armsolutions"."sales_notes_folio_seq"'),
        "status" "armsolutions"."sales_notes_status_enum" NOT NULL DEFAULT 'note',
        "customer_name" varchar(150) NOT NULL,
        "customer_phone" varchar(30),
        "customer_address" varchar(255),
        "customer_email" varchar(150),
        "apply_iva" boolean NOT NULL DEFAULT false,
        "iva_rate" numeric(5,4) NOT NULL DEFAULT 0.1600,
        "subtotal" numeric(12,2) NOT NULL DEFAULT 0.00,
        "iva_amount" numeric(12,2) NOT NULL DEFAULT 0.00,
        "total" numeric(12,2) NOT NULL DEFAULT 0.00,
        "event_id" uuid,
        "notes" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sales_notes" PRIMARY KEY ("id"),
        CONSTRAINT "FK_sales_notes_owner" FOREIGN KEY ("owner_id")
          REFERENCES "auth"."users" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_sales_notes_event" FOREIGN KEY ("event_id")
          REFERENCES "armsolutions"."business_events" ("id") ON DELETE SET NULL
      );
    `);

    // 4. Tabla sales_note_items
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "armsolutions"."sales_note_items" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "note_id" uuid NOT NULL,
        "concept" varchar(255) NOT NULL,
        "quantity" numeric(10,2) NOT NULL DEFAULT 1.00,
        "unit_price" numeric(12,2) NOT NULL DEFAULT 0.00,
        "amount" numeric(12,2) NOT NULL DEFAULT 0.00,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sales_note_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_sales_note_items_note" FOREIGN KEY ("note_id")
          REFERENCES "armsolutions"."sales_notes" ("id") ON DELETE CASCADE
      );
    `);

    // 5. RLS
    for (const table of ['sales_notes', 'sales_note_items']) {
      await queryRunner.query(
        `ALTER TABLE "armsolutions"."${table}" ENABLE ROW LEVEL SECURITY;`,
      );
    }

    // 6. Índices
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_sales_notes_owner"
        ON "armsolutions"."sales_notes" ("owner_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_sales_notes_status"
        ON "armsolutions"."sales_notes" ("status");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_sales_notes_event_id"
        ON "armsolutions"."sales_notes" ("event_id");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_sales_note_items_note_id"
        ON "armsolutions"."sales_note_items" ("note_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "armsolutions"."sales_note_items" CASCADE;`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "armsolutions"."sales_notes" CASCADE;`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS "armsolutions"."sales_notes_status_enum";`,
    );
    await queryRunner.query(
      `DROP SEQUENCE IF EXISTS "armsolutions"."sales_notes_folio_seq";`,
    );
  }
}
