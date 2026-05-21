import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSessions1747440013000 implements MigrationInterface {
  name = 'CreateSessions1747440013000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        plan_id          UUID NULL REFERENCES treatment_plans(id) ON DELETE RESTRICT,
        episode_id       UUID NOT NULL REFERENCES clinical_episodes(id) ON DELETE RESTRICT,
        codigo_hc        VARCHAR(15) NOT NULL,
        patient_id       UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
        profesional_id   UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        tipo             VARCHAR(30) NOT NULL,
        estado           VARCHAR(20) NOT NULL DEFAULT 'PROGRAMADA',
        numero_sesion    INTEGER NOT NULL,
        fecha_sesion     DATE NOT NULL,
        appointment_id   UUID NULL REFERENCES appointments(id) ON DELETE SET NULL,
        observaciones    TEXT NULL,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_sessions_plan_id      ON sessions(plan_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_sessions_episode_id   ON sessions(episode_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_sessions_patient_id   ON sessions(patient_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_sessions_fecha_sesion ON sessions(fecha_sesion)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_sessions_estado        ON sessions(estado)`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_sessions_plan_numero
        ON sessions(plan_id, numero_sesion)
        WHERE plan_id IS NOT NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS uq_sessions_plan_numero`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_sessions_estado`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_sessions_fecha_sesion`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_sessions_patient_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_sessions_episode_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_sessions_plan_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS sessions`);
  }
}
