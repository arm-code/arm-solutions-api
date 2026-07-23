import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración para crear el módulo de Configuración de Negocio e Información Institucional:
 * - Tabla `business_configs` (información corporativa, servicios, coberturas, términos).
 * - Tabla `payment_cards_info` (tarjetas/cuentas bancarias de pago para transferencias).
 */
export class CreateBusinessConfigSchema1753000000000
  implements MigrationInterface
{
  name = 'CreateBusinessConfigSchema1753000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Tabla business_configs
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "armsolutions"."business_configs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(150) NOT NULL DEFAULT 'Eventos Mendoza',
        "logo_url" text,
        "phone" varchar(30),
        "whatsapp" varchar(30),
        "email" varchar(150),
        "address" varchar(255),
        "services" text[] NOT NULL DEFAULT '{}',
        "coverage_areas" text[] NOT NULL DEFAULT '{}',
        "terms_and_conditions" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_business_configs" PRIMARY KEY ("id")
      );
    `);

    // 2. Tabla payment_cards_info
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "armsolutions"."payment_cards_info" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "config_id" uuid NOT NULL,
        "bank" varchar(100) NOT NULL,
        "card_number" varchar(30),
        "clabe" varchar(30),
        "beneficiary" varchar(150) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_payment_cards_info" PRIMARY KEY ("id"),
        CONSTRAINT "FK_payment_cards_info_config" FOREIGN KEY ("config_id")
          REFERENCES "armsolutions"."business_configs" ("id") ON DELETE CASCADE
      );
    `);

    // 3. Row Level Security
    for (const table of ['business_configs', 'payment_cards_info']) {
      await queryRunner.query(
        `ALTER TABLE "armsolutions"."${table}" ENABLE ROW LEVEL SECURITY;`,
      );
    }

    // 4. Índices
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_payment_cards_info_config_id"
        ON "armsolutions"."payment_cards_info" ("config_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "armsolutions"."payment_cards_info" CASCADE;`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "armsolutions"."business_configs" CASCADE;`,
    );
  }
}
