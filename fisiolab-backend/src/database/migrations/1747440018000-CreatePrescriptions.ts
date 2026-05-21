import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePrescriptions1747440018000 implements MigrationInterface {
  name = 'CreatePrescriptions1747440018000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "forma_farmaceutica_enum" AS ENUM (
          'tableta','capsula','jarabe','ampolla','crema',
          'parche','colirio','gotas','supositorio','polvo','aerosol','otro'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "via_administracion_enum" AS ENUM (
          'oral','intravenosa','intramuscular','subcutanea',
          'topica','inhalatoria','rectal','ocular','otro'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "prescriptions" (
        "id"                   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "episode_id"           uuid NOT NULL REFERENCES clinical_episodes(id) ON DELETE RESTRICT,
        "codigo_hc"            varchar(15) NOT NULL,
        "patient_id"           uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
        "medico_id"            uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        "numero_prescripcion"  integer NOT NULL,
        "fecha_prescripcion"   date NOT NULL,
        "firma_digital"        text,
        "observaciones"        text,
        "created_at"           TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"           TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "medications" (
        "id"                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "prescription_id"    uuid NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
        "orden"              smallint NOT NULL DEFAULT 1,
        "principio_activo"   varchar(255) NOT NULL,
        "nombre_comercial"   varchar(255),
        "concentracion"      varchar(100),
        "forma_farmaceutica" forma_farmaceutica_enum,
        "dosis"              varchar(100),
        "via_administracion" via_administracion_enum NOT NULL DEFAULT 'oral',
        "frecuencia"         varchar(100),
        "duracion_dias"      smallint,
        "indicaciones"       text,
        "created_at"         TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at"         TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_prescriptions_episode"  ON "prescriptions" ("episode_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_prescriptions_patient"  ON "prescriptions" ("patient_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_prescriptions_medico"   ON "prescriptions" ("medico_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_medications_prescription" ON "medications" ("prescription_id")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "medications"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "prescriptions"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "forma_farmaceutica_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "via_administracion_enum"`);
  }
}
