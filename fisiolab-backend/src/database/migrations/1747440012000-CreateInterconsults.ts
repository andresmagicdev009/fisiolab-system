import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInterconsults1747440012000 implements MigrationInterface {
  name = 'CreateInterconsults1747440012000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "estado_interconsulta_enum" AS ENUM ('SOLICITADA', 'EN_PROCESO', 'RESPONDIDA');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "interconsults" (
        "id"                   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "episode_id"           uuid NOT NULL REFERENCES clinical_episodes(id) ON DELETE RESTRICT,
        "codigo_hc"            varchar(15) NOT NULL,
        "patient_id"           uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
        "solicitante_id"       uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        "destinatario_id"      uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        "motivo"               text NOT NULL,
        "hallazgos_relevantes" text,
        "pregunta_clinica"     text,
        "estado"               estado_interconsulta_enum NOT NULL DEFAULT 'SOLICITADA',
        "respuesta"            text,
        "fecha_respuesta"      TIMESTAMPTZ,
        "created_at"           TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"           TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_ic_episode"      ON "interconsults" ("episode_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_ic_patient"      ON "interconsults" ("patient_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_ic_solicitante"  ON "interconsults" ("solicitante_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_ic_destinatario" ON "interconsults" ("destinatario_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_ic_estado"       ON "interconsults" ("estado")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "interconsults"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "estado_interconsulta_enum"`);
  }
}
