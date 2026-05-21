import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTipoEjercicioToExercises1747440016000 implements MigrationInterface {
  name = 'AddTipoEjercicioToExercises1747440016000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "tipo_ejercicio_enum" AS ENUM ('repeticiones', 'tiempo', 'cardio', 'libre');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$
    `);

    await queryRunner.query(`
      ALTER TABLE "exercises"
        ADD COLUMN IF NOT EXISTS "tipo_ejercicio" tipo_ejercicio_enum NOT NULL DEFAULT 'repeticiones'
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "exercises" DROP COLUMN IF EXISTS "tipo_ejercicio"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "tipo_ejercicio_enum"`);
  }
}
