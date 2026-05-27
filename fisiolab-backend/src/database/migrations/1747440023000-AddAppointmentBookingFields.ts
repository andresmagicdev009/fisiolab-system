import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAppointmentBookingFields1747440023000 implements MigrationInterface {
  name = 'AddAppointmentBookingFields1747440023000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE appointment_booking_type AS ENUM ('sda', 'pre_book', 'emergencia');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      ALTER TABLE appointments
        ADD COLUMN IF NOT EXISTS booking_type               appointment_booking_type NOT NULL DEFAULT 'pre_book',
        ADD COLUMN IF NOT EXISTS intentos_reagendamiento    INTEGER                  NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS es_reprog_no_show         BOOLEAN                  NOT NULL DEFAULT false;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE appointments
        DROP COLUMN IF EXISTS booking_type,
        DROP COLUMN IF EXISTS intentos_reagendamiento,
        DROP COLUMN IF EXISTS es_reprog_no_show;
    `);
    await queryRunner.query(`DROP TYPE IF EXISTS appointment_booking_type`);
  }
}
