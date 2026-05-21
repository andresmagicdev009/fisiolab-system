import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAppointments1747440011000 implements MigrationInterface {
  name = 'CreateAppointments1747440011000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "tipo_cita_enum" AS ENUM ('PRIMERA_VEZ', 'SEGUIMIENTO', 'INTERCONSULTA');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "estado_cita_enum" AS ENUM ('CONFIRMADA', 'CANCELADA', 'COMPLETADA');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "session_payments" (
        "id"              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "appointment_id"  uuid REFERENCES appointments(id) ON DELETE SET NULL,
        "monto"           decimal(10,2) NOT NULL,
        "estado_pago"     varchar(50) NOT NULL DEFAULT 'PENDIENTE'
                            CHECK (estado_pago IN ('PENDIENTE', 'PAGADO', 'PARCIAL')),
        "metodo_pago"     varchar(50)
                            CHECK (metodo_pago IN ('EFECTIVO', 'TRANSFERENCIA', 'TARJETA', 'SEGURO')),
        "fecha_pago"      TIMESTAMP,
        "created_at"      TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_payments_appointment" ON "session_payments" ("appointment_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_payments_estado"      ON "session_payments" ("estado_pago")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "appointments" (
        "id"                   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "patient_id"           uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
        "professional_id"      uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        "scheduled_at"         TIMESTAMPTZ NOT NULL,
        "duration_minutes"     integer NOT NULL DEFAULT 60,
        "tipo_cita"            tipo_cita_enum NOT NULL,
        "estado"               estado_cita_enum NOT NULL DEFAULT 'CONFIRMADA',
        "motivo"               text,
        "notas"                text,
        "motivo_cancelacion"   text,
        "episode_id"           uuid REFERENCES clinical_episodes(id) ON DELETE SET NULL,
        "session_payment_id"   uuid REFERENCES session_payments(id) ON DELETE SET NULL,
        "created_at"           TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"           TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_appt_patient"      ON "appointments" ("patient_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_appt_professional" ON "appointments" ("professional_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_appt_scheduled"    ON "appointments" ("scheduled_at")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_appt_estado"       ON "appointments" ("estado")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "appointments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "session_payments"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "estado_cita_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "tipo_cita_enum"`);
  }
}
