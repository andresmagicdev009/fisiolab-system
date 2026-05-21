import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTreatmentPlans1747440010000 implements MigrationInterface {
  name = 'CreateTreatmentPlans1747440010000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "estado_plan_enum" AS ENUM ('activo', 'completado', 'cancelado');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "treatment_plans" (
        "id"                        uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "episode_id"                uuid NOT NULL REFERENCES clinical_episodes(id) ON DELETE RESTRICT,
        "codigo_hc"                 varchar(15) NOT NULL,
        "patient_id"                uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
        "profesional_id"            uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        "numero_plan"               integer NOT NULL,
        "estado"                    estado_plan_enum NOT NULL DEFAULT 'activo',
        "objetivo_terapeutico"      text NOT NULL,
        "duracion_estimada_semanas" smallint,
        "frecuencia_semanal"        smallint,
        "fecha_inicio"              date,
        "fecha_fin"                 date,
        "progreso_porcentaje"       decimal(5,2) NOT NULL DEFAULT 0,
        "observaciones"             text,
        "created_at"                TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"                TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "exercises" (
        "id"                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "plan_id"           uuid NOT NULL REFERENCES treatment_plans(id) ON DELETE CASCADE,
        "nombre"            varchar(255) NOT NULL,
        "descripcion"       text,
        "series"            smallint,
        "repeticiones"      smallint,
        "duracion_segundos" smallint,
        "orden"             smallint NOT NULL,
        "observaciones"     text,
        "created_at"        TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"        TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_plans_episode"     ON "treatment_plans" ("episode_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_plans_patient"     ON "treatment_plans" ("patient_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_plans_profesional" ON "treatment_plans" ("profesional_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_exercises_plan"    ON "exercises" ("plan_id")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "exercises"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "treatment_plans"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "estado_plan_enum"`);
  }
}
