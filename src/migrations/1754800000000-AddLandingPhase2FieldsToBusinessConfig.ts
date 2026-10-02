import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración: Fase 2 — Campos del landing público de negocios
 *
 * Cambios:
 *  1. Columna `whatsapp_message` en `business_configs`
 *  2. Tabla `business_gallery_items` (carrusel de imágenes del catálogo)
 *  3. Tabla `business_values` (valores corporativos)
 *  4. Tabla `business_stats` (métricas "En números")
 *  5. Tabla `business_testimonials` (reseñas de clientes)
 *  6. Tabla `business_faqs` (preguntas frecuentes)
 */
export class AddLandingPhase2FieldsToBusinessConfig1754800000000
  implements MigrationInterface
{
  name = 'AddLandingPhase2FieldsToBusinessConfig1754800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. whatsapp_message en la config principal
    await queryRunner.query(`
      ALTER TABLE armsolutions.business_configs
        ADD COLUMN IF NOT EXISTS whatsapp_message TEXT;
    `);

    // 2. Galería de imágenes
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS armsolutions.business_gallery_items (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        config_id   UUID NOT NULL REFERENCES armsolutions.business_configs(id) ON DELETE CASCADE,
        url         TEXT NOT NULL,
        label       VARCHAR(150),
        alt         VARCHAR(255),
        "order"     INT NOT NULL DEFAULT 0,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_gallery_config_id ON armsolutions.business_gallery_items(config_id);
    `);

    // 3. Valores corporativos
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS armsolutions.business_values (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        config_id   UUID NOT NULL REFERENCES armsolutions.business_configs(id) ON DELETE CASCADE,
        title       VARCHAR(150) NOT NULL,
        description TEXT,
        icon        VARCHAR(100),
        "order"     INT NOT NULL DEFAULT 0,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_values_config_id ON armsolutions.business_values(config_id);
    `);

    // 4. Estadísticas "En números"
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS armsolutions.business_stats (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        config_id   UUID NOT NULL REFERENCES armsolutions.business_configs(id) ON DELETE CASCADE,
        value       VARCHAR(50) NOT NULL,
        label       VARCHAR(150) NOT NULL,
        "order"     INT NOT NULL DEFAULT 0,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_stats_config_id ON armsolutions.business_stats(config_id);
    `);

    // 5. Testimonios de clientes
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS armsolutions.business_testimonials (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        config_id   UUID NOT NULL REFERENCES armsolutions.business_configs(id) ON DELETE CASCADE,
        text        TEXT NOT NULL,
        author      VARCHAR(150) NOT NULL,
        rating      SMALLINT NOT NULL DEFAULT 5,
        "order"     INT NOT NULL DEFAULT 0,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_testimonials_config_id ON armsolutions.business_testimonials(config_id);
    `);

    // 6. Preguntas frecuentes
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS armsolutions.business_faqs (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        config_id   UUID NOT NULL REFERENCES armsolutions.business_configs(id) ON DELETE CASCADE,
        question    TEXT NOT NULL,
        answer      TEXT NOT NULL,
        "order"     INT NOT NULL DEFAULT 0,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_faqs_config_id ON armsolutions.business_faqs(config_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS armsolutions.business_faqs;`);
    await queryRunner.query(`DROP TABLE IF EXISTS armsolutions.business_testimonials;`);
    await queryRunner.query(`DROP TABLE IF EXISTS armsolutions.business_stats;`);
    await queryRunner.query(`DROP TABLE IF EXISTS armsolutions.business_values;`);
    await queryRunner.query(`DROP TABLE IF EXISTS armsolutions.business_gallery_items;`);
    await queryRunner.query(`
      ALTER TABLE armsolutions.business_configs
        DROP COLUMN IF EXISTS whatsapp_message;
    `);
  }
}
