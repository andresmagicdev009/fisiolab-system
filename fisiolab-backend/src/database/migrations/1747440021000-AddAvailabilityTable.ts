import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAvailabilityTable1747440021000 implements MigrationInterface {
  name = 'AddAvailabilityTable1747440021000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE day_of_week AS ENUM (
          'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS availabilities (
        id                    UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
        professional_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        day_of_week           day_of_week NOT NULL,
        start_time            TIME        NOT NULL,
        end_time              TIME        NOT NULL,
        slot_duration_minutes INTEGER     NOT NULL DEFAULT 30,
        break_duration_minutes INTEGER    NOT NULL DEFAULT 0,
        is_active             BOOLEAN     NOT NULL DEFAULT true,
        effective_from        DATE        NULL,
        effective_until       DATE        NULL,
        created_at            TIMESTAMP   NOT NULL DEFAULT NOW(),
        updated_at            TIMESTAMP   NOT NULL DEFAULT NOW(),

        CONSTRAINT chk_avail_time_range
          CHECK (start_time < end_time),
        CONSTRAINT chk_avail_slot_duration
          CHECK (slot_duration_minutes BETWEEN 15 AND 120),
        CONSTRAINT chk_avail_break_duration
          CHECK (break_duration_minutes BETWEEN 0 AND 60)
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_availability_professional_day
        ON availabilities (professional_id, day_of_week, is_active);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_availability_professional_day`);
    await queryRunner.query(`DROP TABLE IF EXISTS availabilities`);
    await queryRunner.query(`DROP TYPE IF EXISTS day_of_week`);
  }
}
