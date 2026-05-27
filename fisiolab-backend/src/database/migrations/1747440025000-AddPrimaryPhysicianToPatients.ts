import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPrimaryPhysicianToPatients1747440025000 implements MigrationInterface {
  name = 'AddPrimaryPhysicianToPatients1747440025000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE patients
        ADD COLUMN IF NOT EXISTS primary_physician_id UUID NULL
          REFERENCES users(id) ON DELETE SET NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_patients_primary_physician
        ON patients (primary_physician_id);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_patients_primary_physician`);
    await queryRunner.query(`
      ALTER TABLE patients
        DROP COLUMN IF EXISTS primary_physician_id;
    `);
  }
}
