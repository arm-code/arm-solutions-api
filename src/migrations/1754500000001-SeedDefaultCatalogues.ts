import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migración: Seed de catálogos por negocio (post multi-tenant backfill)
 *
 * Para cada negocio existente en `businesses`:
 *   1. Inserta `payment_methods` defaults (Efectivo, Transferencia) si no existen.
 *   2. Inserta `transaction_categories` defaults si no existen.
 *
 * Los registros globales previos (business_id IS NULL) se eliminarán al final,
 * ya que ahora cada tabla es por-negocio.
 */
export class SeedDefaultCatalogues1754500000001 implements MigrationInterface {
  name = 'SeedDefaultCatalogues1754500000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Seed de catálogos para cada negocio existente
    await queryRunner.query(`
      DO $$
      DECLARE
        biz RECORD;
      BEGIN
        FOR biz IN SELECT id FROM armsolutions.businesses LOOP

          -- payment_methods por negocio
          INSERT INTO armsolutions.payment_methods (code, name, business_id)
          VALUES
            ('CASH',     'Efectivo',       biz.id),
            ('TRANSFER', 'Transferencia',  biz.id),
            ('CARD',     'Tarjeta',        biz.id)
          ON CONFLICT DO NOTHING;

          -- transaction_categories por negocio
          INSERT INTO armsolutions.transaction_categories (code, name, business_id)
          VALUES
            ('RENTA',         'Renta de mobiliario/equipo', biz.id),
            ('GASOLINA',      'Gasolina',                   biz.id),
            ('COMIDAS',       'Comidas',                    biz.id),
            ('SUELDOS',       'Sueldos',                    biz.id),
            ('FLETES',        'Fletes',                     biz.id),
            ('MANTENIMIENTO', 'Mantenimiento',               biz.id),
            ('OTROS',         'Otros',                       biz.id)
          ON CONFLICT DO NOTHING;

        END LOOP;
      END $$;
    `);

    // Migrar transacciones y eventos existentes a los catálogos por negocio
    // (asocia los registros huérfanos de catálogo con los del negocio correcto)
    await queryRunner.query(`
      DO $$
      DECLARE
        biz RECORD;
        old_pm RECORD;
        new_pm_id UUID;
        old_cat RECORD;
        new_cat_id UUID;
      BEGIN
        FOR biz IN SELECT id FROM armsolutions.businesses LOOP

          -- Reasignar payment_method_id en transactions al equivalente del negocio
          FOR old_pm IN
            SELECT DISTINCT pm.id, pm.code
            FROM armsolutions.payment_methods pm
            JOIN armsolutions.transactions t ON t.payment_method_id = pm.id
            WHERE t.business_id = biz.id
              AND pm.business_id IS NULL
          LOOP
            SELECT id INTO new_pm_id
            FROM armsolutions.payment_methods
            WHERE code = old_pm.code AND business_id = biz.id
            LIMIT 1;

            IF new_pm_id IS NOT NULL THEN
              UPDATE armsolutions.transactions
                SET payment_method_id = new_pm_id
                WHERE business_id = biz.id
                  AND payment_method_id = old_pm.id;
            END IF;
          END LOOP;

          -- Reasignar category_id en transactions al equivalente del negocio
          FOR old_cat IN
            SELECT DISTINCT tc.id, tc.code
            FROM armsolutions.transaction_categories tc
            JOIN armsolutions.transactions t ON t.category_id = tc.id
            WHERE t.business_id = biz.id
              AND tc.business_id IS NULL
          LOOP
            SELECT id INTO new_cat_id
            FROM armsolutions.transaction_categories
            WHERE code = old_cat.code AND business_id = biz.id
            LIMIT 1;

            IF new_cat_id IS NOT NULL THEN
              UPDATE armsolutions.transactions
                SET category_id = new_cat_id
                WHERE business_id = biz.id
                  AND category_id = old_cat.id;
            END IF;
          END LOOP;

        END LOOP;
      END $$;
    `);

    // Eliminar registros globales (business_id IS NULL) de catálogos
    // que ya no se usan por ninguna transacción activa
    await queryRunner.query(`
      DELETE FROM armsolutions.payment_methods
        WHERE business_id IS NULL
          AND id NOT IN (
            SELECT DISTINCT payment_method_id FROM armsolutions.transactions
            WHERE payment_method_id IS NOT NULL
          );
    `);

    await queryRunner.query(`
      DELETE FROM armsolutions.transaction_categories
        WHERE business_id IS NULL
          AND id NOT IN (
            SELECT DISTINCT category_id FROM armsolutions.transactions
            WHERE category_id IS NOT NULL
          );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar registros de catálogos que tienen business_id (revertir a globales)
    await queryRunner.query(`
      DELETE FROM armsolutions.payment_methods WHERE business_id IS NOT NULL;
    `);
    await queryRunner.query(`
      DELETE FROM armsolutions.transaction_categories WHERE business_id IS NOT NULL;
    `);

    // Re-crear los catálogos globales originales
    await queryRunner.query(`
      INSERT INTO armsolutions.payment_methods (code, name)
      VALUES
        ('CASH', 'Efectivo'),
        ('TRANSFER', 'Transferencia')
      ON CONFLICT (code) DO NOTHING;
    `);
    await queryRunner.query(`
      INSERT INTO armsolutions.transaction_categories (code, name)
      VALUES
        ('RENTA',         'Renta de mobiliario/equipo'),
        ('GASOLINA',      'Gasolina'),
        ('COMIDAS',       'Comidas'),
        ('SUELDOS',       'Sueldos'),
        ('FLETES',        'Fletes'),
        ('MANTENIMIENTO', 'Mantenimiento')
      ON CONFLICT (code) DO NOTHING;
    `);
  }
}
