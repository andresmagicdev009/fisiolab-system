import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateClinicalEpisodes1747440007000 implements MigrationInterface {
  name = 'CreateClinicalEpisodes1747440007000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "clinical_episodes_estado_enum" AS ENUM ('abierto', 'en_tratamiento', 'cerrado', 'archivado');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "clinical_episodes" (
        "id"                     uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tarjetero_id"           uuid NOT NULL REFERENCES tarjetero_indice(id) ON DELETE RESTRICT,
        "codigo_hc"              varchar(15) NOT NULL,
        "patient_id"             uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
        "profesional_id"         uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        "estado"                 "clinical_episodes_estado_enum" NOT NULL DEFAULT 'abierto',
        "motivo_consulta"        varchar(500) NOT NULL,
        "diagnostico_principal"  varchar(255),
        "codigo_cie10"           varchar(10),
        "diagnostico_secundario" varchar(255),
        "nota_apertura"          text,
        "nota_cierre"            text,
        "fecha_apertura"         date NOT NULL,
        "fecha_cierre"           date,
        "appointment_id"         uuid,
        "created_at"             TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"             TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_episodes_patient"     ON "clinical_episodes" ("patient_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_episodes_profesional" ON "clinical_episodes" ("profesional_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_episodes_estado"      ON "clinical_episodes" ("estado")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_episodes_fecha"       ON "clinical_episodes" ("fecha_apertura")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "clinical_episodes"`);
    await queryRunner.query(`DROP TYPE  IF EXISTS "clinical_episodes_estado_enum"`);
  }
}
