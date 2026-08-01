import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPublicLandingFieldsToBusinessConfig1754700000000
  implements MigrationInterface
{
  name = 'AddPublicLandingFieldsToBusinessConfig1754700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE armsolutions.business_configs
        ADD COLUMN IF NOT EXISTS description TEXT,
        ADD COLUMN IF NOT EXISTS history TEXT,
        ADD COLUMN IF NOT EXISTS mission TEXT,
        ADD COLUMN IF NOT EXISTS vision TEXT,
        ADD COLUMN IF NOT EXISTS opening_hours VARCHAR(150);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE armsolutions.business_configs
        DROP COLUMN IF EXISTS description,
        DROP COLUMN IF EXISTS history,
        DROP COLUMN IF EXISTS mission,
        DROP COLUMN IF EXISTS vision,
        DROP COLUMN IF EXISTS opening_hours;
    `);
  }
}
