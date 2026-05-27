import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddZonaHorariaToAvailability1747440027000 implements MigrationInterface {
  name = 'AddZonaHorariaToAvailability1747440027000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE availabilities
        ADD COLUMN IF NOT EXISTS zona_horaria VARCHAR(64) NOT NULL DEFAULT 'America/Guayaquil';
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE availabilities
        DROP COLUMN IF EXISTS zona_horaria;
    `);
  }
}
