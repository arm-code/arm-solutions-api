import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración para extender la tabla `business_events` con campos de gestión de eventos:
 * - Secuencia y columna `folio_number` para folios correlativos (ej. EV-0001).
 * - `client_phone`, `event_address`, `cost`, `status`, `guarantee_document`, `note_id`.
 */
export class UpdateBusinessEventsSchema1752800000000
  implements MigrationInterface
{
  name = 'UpdateBusinessEventsSchema1752800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Secuencia para folios correlativos de eventos
    await queryRunner.query(
      `CREATE SEQUENCE IF NOT EXISTS "armsolutions"."business_events_folio_seq" START WITH 1;`,
    );

    // 2. Enum de estados del evento
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "armsolutions"."business_events_status_enum" AS ENUM ('pending', 'delivered', 'collected', 'cancelled');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    // 3. Añadir nuevas columnas a business_events
    await queryRunner.query(`
      ALTER TABLE "armsolutions"."business_events"
        ADD COLUMN IF NOT EXISTS "folio_number" integer NOT NULL DEFAULT nextval('"armsolutions"."business_events_folio_seq"'),
        ADD COLUMN IF NOT EXISTS "client_phone" varchar(30),
        ADD COLUMN IF NOT EXISTS "event_address" varchar(255),
        ADD COLUMN IF NOT EXISTS "cost" numeric(12,2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "status" "armsolutions"."business_events_status_enum" NOT NULL DEFAULT 'pending',
        ADD COLUMN IF NOT EXISTS "guarantee_document" varchar(150),
        ADD COLUMN IF NOT EXISTS "note_id" uuid;
    `);

    // 4. Índices para optimizar búsquedas y unicidad
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_business_events_owner_folio"
        ON "armsolutions"."business_events" ("owner_id", "folio_number");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_business_events_status"
        ON "armsolutions"."business_events" ("status");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "armsolutions"."IDX_business_events_status";`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "armsolutions"."IDX_business_events_owner_folio";`,
    );
    await queryRunner.query(`
      ALTER TABLE "armsolutions"."business_events"
        DROP COLUMN IF EXISTS "note_id",
        DROP COLUMN IF EXISTS "guarantee_document",
        DROP COLUMN IF EXISTS "status",
        DROP COLUMN IF EXISTS "cost",
        DROP COLUMN IF EXISTS "event_address",
        DROP COLUMN IF EXISTS "client_phone",
        DROP COLUMN IF EXISTS "folio_number";
    `);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "armsolutions"."business_events_status_enum";`,
    );
    await queryRunner.query(
      `DROP SEQUENCE IF EXISTS "armsolutions"."business_events_folio_seq";`,
    );
  }
}
