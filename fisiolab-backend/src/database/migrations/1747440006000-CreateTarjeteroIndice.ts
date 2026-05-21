import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTarjeteroIndice1747440006000 implements MigrationInterface {
  name = 'CreateTarjeteroIndice1747440006000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "tarjetero_indice_estado_enum" AS ENUM ('activo', 'inactivo', 'archivado');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "tarjetero_indice" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "codigo_hc" varchar(15) NOT NULL,
        "patient_id" uuid NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
        "medico_responsable_id" uuid REFERENCES users(id) ON DELETE SET NULL,
        "estado" "tarjetero_indice_estado_enum" NOT NULL DEFAULT 'activo',
        "observaciones" text,
        "fecha_apertura" date NOT NULL,
        "anio_secuencia" integer NOT NULL,
        "numero_secuencia" integer NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_tarjetero_codigo_hc" ON "tarjetero_indice" ("codigo_hc")`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "idx_tarjetero_patient" ON "tarjetero_indice" ("patient_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_tarjetero_anio_secuencia" ON "tarjetero_indice" ("anio_secuencia", "numero_secuencia")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "tarjetero_indice"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "tarjetero_indice_estado_enum"`);
  }
}
