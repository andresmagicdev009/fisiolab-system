import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSoapNotes1747440008000 implements MigrationInterface {
  name = 'CreateSoapNotes1747440008000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "soap_notes" (
        "id"             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "episode_id"     uuid NOT NULL REFERENCES clinical_episodes(id) ON DELETE RESTRICT,
        "codigo_hc"      varchar(15) NOT NULL,
        "patient_id"     uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
        "profesional_id" uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        "numero_sesion"  integer NOT NULL,
        "fecha_sesion"   date NOT NULL,
        "subjetivo"      jsonb NOT NULL,
        "objetivo"       jsonb NOT NULL,
        "analisis"       jsonb NOT NULL DEFAULT '{}',
        "plan"           jsonb NOT NULL DEFAULT '{}',
        "observaciones"  text,
        "created_at"     TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"     TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "uq_soap_episode_sesion" UNIQUE ("episode_id", "numero_sesion")
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_soap_episode"    ON "soap_notes" ("episode_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_soap_patient"    ON "soap_notes" ("patient_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_soap_fecha"      ON "soap_notes" ("fecha_sesion")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_soap_profesional" ON "soap_notes" ("profesional_id")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "soap_notes"`);
  }
}
