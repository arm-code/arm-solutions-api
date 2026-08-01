import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración: Módulo de Inventario
 *
 * Convención de nombres: sufijo `_inv` para identificar tablas de este módulo.
 *
 * Tablas creadas en el schema `armsolutions`:
 *   1. locations_inv      — Bodegas, salas y vehículos
 *   2. categories_inv     — Categorías con atributos dinámicos (JSONB)
 *   3. items_inv          — Ítems de inventario (product, serialized, combo, consumable, service)
 *   4. item_serials_inv   — Números de serie individuales para ítems serializados
 *   5. movements_inv      — Registro de auditoría de movimientos de stock
 */
export class CreateInventorySchema1754000000000 implements MigrationInterface {
  name = 'CreateInventorySchema1754000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. Enums ──────────────────────────────────────────────────────────────

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE armsolutions.inventory_location_type_enum
          AS ENUM ('warehouse', 'room', 'vehicle');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE armsolutions.inventory_item_type_enum
          AS ENUM ('product', 'serialized', 'combo', 'consumable', 'service');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE armsolutions.inventory_item_status_enum
          AS ENUM ('available', 'rented', 'maintenance', 'damaged', 'lost', 'retired');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE armsolutions.inventory_movement_type_enum
          AS ENUM ('in', 'out', 'transfer', 'adjustment');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    // ── 2. locations_inv ──────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS armsolutions.locations_inv (
        id          UUID         NOT NULL DEFAULT gen_random_uuid(),
        owner_id    UUID         NOT NULL,
        name        VARCHAR(100) NOT NULL,
        type        armsolutions.inventory_location_type_enum NOT NULL,
        is_active   BOOLEAN      NOT NULL DEFAULT true,
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
        updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_locations_inv" PRIMARY KEY (id)
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_locations_inv_owner_id"
        ON armsolutions.locations_inv (owner_id);
    `);

    // ── 3. categories_inv ─────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS armsolutions.categories_inv (
        id          UUID         NOT NULL DEFAULT gen_random_uuid(),
        owner_id    UUID         NOT NULL,
        name        VARCHAR(100) NOT NULL,
        color       VARCHAR(30)  NOT NULL DEFAULT '#6b7280',
        attributes  JSONB        NOT NULL DEFAULT '[]',
        is_active   BOOLEAN      NOT NULL DEFAULT true,
        created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
        updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_categories_inv" PRIMARY KEY (id)
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_categories_inv_owner_id"
        ON armsolutions.categories_inv (owner_id);
    `);

    // ── 4. items_inv ──────────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS armsolutions.items_inv (
        id              UUID         NOT NULL DEFAULT gen_random_uuid(),
        owner_id        UUID         NOT NULL,
        name            VARCHAR(200) NOT NULL,
        sku             VARCHAR(100) NOT NULL,
        type            armsolutions.inventory_item_type_enum   NOT NULL,
        status          armsolutions.inventory_item_status_enum NOT NULL DEFAULT 'available',
        category_id     UUID         NOT NULL,
        location_id     UUID,
        rent_price      NUMERIC(12, 2),
        sale_price      NUMERIC(12, 2),
        stock_total     INTEGER      NOT NULL DEFAULT 0,
        stock_available INTEGER      NOT NULL DEFAULT 0,
        stock_reserved  INTEGER      NOT NULL DEFAULT 0,
        stock_rented    INTEGER      NOT NULL DEFAULT 0,
        attributes      JSONB        NOT NULL DEFAULT '{}',
        is_active       BOOLEAN      NOT NULL DEFAULT true,
        created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
        updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_items_inv" PRIMARY KEY (id),
        CONSTRAINT "UQ_items_inv_owner_sku"
          UNIQUE (owner_id, sku),
        CONSTRAINT "FK_items_inv_category"
          FOREIGN KEY (category_id)
          REFERENCES armsolutions.categories_inv (id)
          ON DELETE RESTRICT,
        CONSTRAINT "FK_items_inv_location"
          FOREIGN KEY (location_id)
          REFERENCES armsolutions.locations_inv (id)
          ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_items_inv_owner_id"
        ON armsolutions.items_inv (owner_id);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_items_inv_category_id"
        ON armsolutions.items_inv (category_id);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_items_inv_status"
        ON armsolutions.items_inv (status);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_items_inv_type"
        ON armsolutions.items_inv (type);
    `);

    // ── 5. item_serials_inv ───────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS armsolutions.item_serials_inv (
        id            UUID         NOT NULL DEFAULT gen_random_uuid(),
        item_id       UUID         NOT NULL,
        serial_number VARCHAR(200) NOT NULL,
        status        armsolutions.inventory_item_status_enum NOT NULL DEFAULT 'available',
        notes         TEXT,
        created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
        updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_item_serials_inv" PRIMARY KEY (id),
        CONSTRAINT "FK_item_serials_inv_item"
          FOREIGN KEY (item_id)
          REFERENCES armsolutions.items_inv (id)
          ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_item_serials_inv_item_id"
        ON armsolutions.item_serials_inv (item_id);
    `);

    // ── 6. movements_inv ──────────────────────────────────────────────────────

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS armsolutions.movements_inv (
        id                      UUID         NOT NULL DEFAULT gen_random_uuid(),
        owner_id                UUID         NOT NULL,
        item_id                 UUID         NOT NULL,
        type                    armsolutions.inventory_movement_type_enum NOT NULL,
        quantity                INTEGER      NOT NULL,
        origin_location_id      UUID,
        destination_location_id UUID,
        reason                  TEXT,
        snapshot_stock_before   JSONB        NOT NULL,
        snapshot_stock_after    JSONB        NOT NULL,
        created_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),
        updated_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_movements_inv" PRIMARY KEY (id),
        CONSTRAINT "FK_movements_inv_item"
          FOREIGN KEY (item_id)
          REFERENCES armsolutions.items_inv (id)
          ON DELETE RESTRICT,
        CONSTRAINT "FK_movements_inv_origin_location"
          FOREIGN KEY (origin_location_id)
          REFERENCES armsolutions.locations_inv (id)
          ON DELETE SET NULL,
        CONSTRAINT "FK_movements_inv_destination_location"
          FOREIGN KEY (destination_location_id)
          REFERENCES armsolutions.locations_inv (id)
          ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_movements_inv_owner_id"
        ON armsolutions.movements_inv (owner_id);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_movements_inv_item_id"
        ON armsolutions.movements_inv (item_id);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_movements_inv_type"
        ON armsolutions.movements_inv (type);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_movements_inv_created_at"
        ON armsolutions.movements_inv (created_at);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS armsolutions.movements_inv;`);
    await queryRunner.query(`DROP TABLE IF EXISTS armsolutions.item_serials_inv;`);
    await queryRunner.query(`DROP TABLE IF EXISTS armsolutions.items_inv;`);
    await queryRunner.query(`DROP TABLE IF EXISTS armsolutions.categories_inv;`);
    await queryRunner.query(`DROP TABLE IF EXISTS armsolutions.locations_inv;`);

    await queryRunner.query(
      `DROP TYPE IF EXISTS armsolutions.inventory_movement_type_enum;`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS armsolutions.inventory_item_status_enum;`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS armsolutions.inventory_item_type_enum;`,
    );
    await queryRunner.query(
      `DROP TYPE IF EXISTS armsolutions.inventory_location_type_enum;`,
    );
  }
}
