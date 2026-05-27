import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSchedulingFieldsToAppointments1747440026000 implements MigrationInterface {
  name = 'AddSchedulingFieldsToAppointments1747440026000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE appointments
        ADD COLUMN IF NOT EXISTS session_id        UUID NULL REFERENCES sessions(id)        ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS treatment_plan_id UUID NULL REFERENCES treatment_plans(id) ON DELETE SET NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_appointment_slot_count
        ON appointments (professional_id, scheduled_at, estado);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_appointment_plan
        ON appointments (treatment_plan_id) WHERE treatment_plan_id IS NOT NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_appointment_session
        ON appointments (session_id) WHERE session_id IS NOT NULL;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_appointment_session`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_appointment_plan`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_appointment_slot_count`);
    await queryRunner.query(`
      ALTER TABLE appointments
        DROP COLUMN IF EXISTS treatment_plan_id,
        DROP COLUMN IF EXISTS session_id;
    `);
  }
}
