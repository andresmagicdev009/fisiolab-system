import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePhysicalEvaluations1747440009000 implements MigrationInterface {
  name = 'CreatePhysicalEvaluations1747440009000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "physical_evaluations" (
        "id"                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "episode_id"          uuid NOT NULL REFERENCES clinical_episodes(id) ON DELETE RESTRICT,
        "codigo_hc"           varchar(15) NOT NULL,
        "patient_id"          uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
        "profesional_id"      uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        "numero_evaluacion"   integer NOT NULL,
        "fecha_evaluacion"    date NOT NULL,
        "rango_movimiento"    jsonb,
        "fuerza_muscular"     jsonb,
        "escala_dolor"        smallint CHECK (escala_dolor BETWEEN 0 AND 10),
        "pruebas_especificas" jsonb,
        "inspeccion"          text,
        "palpacion"           text,
        "diagnostico"         text,
        "observaciones"       text,
        "created_at"          TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"          TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_eval_episode"     ON "physical_evaluations" ("episode_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_eval_patient"     ON "physical_evaluations" ("patient_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_eval_fecha"       ON "physical_evaluations" ("fecha_evaluacion")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_eval_profesional" ON "physical_evaluations" ("profesional_id")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "physical_evaluations"`);
  }
}
