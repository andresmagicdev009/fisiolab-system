import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAppointmentIdToTreatmentPlans1747440015000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE treatment_plans
      ADD COLUMN IF NOT EXISTS appointment_id UUID NULL
        REFERENCES appointments(id) ON DELETE SET NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE treatment_plans DROP COLUMN IF EXISTS appointment_id;
    `);
  }
}
