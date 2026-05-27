import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWaitingListTable1747440022000 implements MigrationInterface {
  name = 'AddWaitingListTable1747440022000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE waiting_list_priority AS ENUM ('urgent', 'high', 'normal', 'low');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE waiting_list_status AS ENUM ('pending', 'assigned', 'cancelled', 'expired');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS waiting_lists (
        id                       UUID                  PRIMARY KEY DEFAULT uuid_generate_v4(),
        patient_id               UUID                  NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        preferred_professional_id UUID                 NULL REFERENCES users(id) ON DELETE SET NULL,
        tipo_cita_solicitado     VARCHAR(50)           NOT NULL,
        fecha_deseada            DATE                  NOT NULL,
        prioridad                waiting_list_priority NOT NULL DEFAULT 'normal',
        motivo_consulta          TEXT                  NULL,
        estado                   waiting_list_status   NOT NULL DEFAULT 'pending',
        atendido_en              TIMESTAMP             NULL,
        appointment_id           UUID                  NULL REFERENCES appointments(id) ON DELETE SET NULL,
        created_at               TIMESTAMP             NOT NULL DEFAULT NOW(),
        updated_at               TIMESTAMP             NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_waiting_list_estado_prioridad
        ON waiting_lists (estado, prioridad, created_at);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_waiting_list_patient
        ON waiting_lists (patient_id);
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_waiting_list_patient`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_waiting_list_estado_prioridad`);
    await queryRunner.query(`DROP TABLE IF EXISTS waiting_lists`);
    await queryRunner.query(`DROP TYPE IF EXISTS waiting_list_priority`);
    await queryRunner.query(`DROP TYPE IF EXISTS waiting_list_status`);
  }
}
