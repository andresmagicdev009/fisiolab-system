import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCapacidadAtencionParalelaToUsers1747440024000 implements MigrationInterface {
  name = 'AddCapacidadAtencionParalelaToUsers1747440024000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS capacidad_atencion_paralela INTEGER NOT NULL DEFAULT 1,
        ADD CONSTRAINT chk_users_capacidad_range
          CHECK (capacidad_atencion_paralela BETWEEN 1 AND 10);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
        DROP CONSTRAINT IF EXISTS chk_users_capacidad_range,
        DROP COLUMN IF EXISTS capacidad_atencion_paralela;
    `);
  }
}
