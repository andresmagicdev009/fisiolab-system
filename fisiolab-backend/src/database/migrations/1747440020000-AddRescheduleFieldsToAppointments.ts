import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRescheduleFieldsToAppointments1747440020000 implements MigrationInterface {
  name = 'AddRescheduleFieldsToAppointments1747440020000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Add new enum values (ADD VALUE is transactional-safe in PG 12+)
    await queryRunner.query(`ALTER TYPE "estado_cita_enum" ADD VALUE IF NOT EXISTS 'REPROGRAMADA'`);
    await queryRunner.query(`ALTER TYPE "estado_cita_enum" ADD VALUE IF NOT EXISTS 'NO_ASISTIO'`);

    await queryRunner.query(`
      ALTER TABLE "appointments"
        ADD COLUMN IF NOT EXISTS "reprogramada_de_id" uuid NULL
          REFERENCES appointments(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS "nueva_cita_id" uuid NULL
          REFERENCES appointments(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS "motivo_reprogramacion" varchar(500) NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_appt_reprogramada_de" ON "appointments" ("reprogramada_de_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_appt_nueva_cita" ON "appointments" ("nueva_cita_id")
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_appt_nueva_cita"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_appt_reprogramada_de"`);
    await queryRunner.query(`
      ALTER TABLE "appointments"
        DROP COLUMN IF EXISTS "motivo_reprogramacion",
        DROP COLUMN IF EXISTS "nueva_cita_id",
        DROP COLUMN IF EXISTS "reprogramada_de_id"
    `);
    // Note: PostgreSQL does not support removing enum values — manual cleanup needed
  }
}
