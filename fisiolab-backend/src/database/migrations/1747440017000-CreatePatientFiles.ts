import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePatientFiles1747440017000 implements MigrationInterface {
  name = 'CreatePatientFiles1747440017000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "categoria_archivo_enum" AS ENUM (
          'laboratorio', 'imagen', 'referencia', 'consentimiento', 'receta', 'otro'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "patient_files" (
        "id"                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "patient_id"        uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        "episode_id"        uuid REFERENCES clinical_episodes(id) ON DELETE SET NULL,
        "uploaded_by"       uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        "filename_original" varchar(500) NOT NULL,
        "filename_stored"   varchar(500) NOT NULL,
        "storage_key"       varchar(1000) NOT NULL,
        "mimetype"          varchar(100) NOT NULL,
        "size_bytes"        integer NOT NULL,
        "categoria"         categoria_archivo_enum NOT NULL DEFAULT 'otro',
        "descripcion"       text,
        "created_at"        TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"        TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_patient_files_patient" ON "patient_files" ("patient_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_patient_files_episode" ON "patient_files" ("episode_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_patient_files_uploader" ON "patient_files" ("uploaded_by")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "patient_files"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "categoria_archivo_enum"`);
  }
}
