import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBusinessIdToSalesNotes1754600000000 implements MigrationInterface {
  name = 'AddBusinessIdToSalesNotes1754600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Agregar columna business_id a sales_notes
    await queryRunner.query(`
      ALTER TABLE armsolutions.sales_notes
        ADD COLUMN IF NOT EXISTS business_id UUID;
    `);

    // 2. Backfill: intentar asignar business_id en base a owner_id o al primer negocio si coincide
    await queryRunner.query(`
      DO $$
      BEGIN
        UPDATE armsolutions.sales_notes sn
        SET business_id = bu.business_id
        FROM armsolutions.business_users bu
        WHERE sn.owner_id = bu.user_id AND sn.business_id IS NULL;
      END $$;
    `);

    // 3. Crear índice para acelerar búsquedas
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_sales_notes_business_id"
        ON armsolutions.sales_notes (business_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS armsolutions."IDX_sales_notes_business_id";
    `);
    await queryRunner.query(`
      ALTER TABLE armsolutions.sales_notes DROP COLUMN IF EXISTS business_id;
    `);
  }
}
