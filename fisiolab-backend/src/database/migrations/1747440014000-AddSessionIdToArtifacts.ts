import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSessionIdToArtifacts1747440014000 implements MigrationInterface {
  name = 'AddSessionIdToArtifacts1747440014000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE soap_notes
        ADD COLUMN IF NOT EXISTS session_id UUID NULL
          REFERENCES sessions(id) ON DELETE SET NULL
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_soap_notes_session_id ON soap_notes(session_id)`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_soap_notes_session_id
        ON soap_notes(session_id)
        WHERE session_id IS NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE physical_evaluations
        ADD COLUMN IF NOT EXISTS session_id UUID NULL
          REFERENCES sessions(id) ON DELETE SET NULL
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_physical_evals_session_id ON physical_evaluations(session_id)`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_physical_evals_session_id
        ON physical_evaluations(session_id)
        WHERE session_id IS NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE interconsults
        ADD COLUMN IF NOT EXISTS session_id UUID NULL
          REFERENCES sessions(id) ON DELETE SET NULL
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_interconsults_session_id ON interconsults(session_id)`);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_interconsults_session_id
        ON interconsults(session_id)
        WHERE session_id IS NOT NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS uq_interconsults_session_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_interconsults_session_id`);
    await queryRunner.query(`ALTER TABLE interconsults DROP COLUMN IF EXISTS session_id`);

    await queryRunner.query(`DROP INDEX IF EXISTS uq_physical_evals_session_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_physical_evals_session_id`);
    await queryRunner.query(`ALTER TABLE physical_evaluations DROP COLUMN IF EXISTS session_id`);

    await queryRunner.query(`DROP INDEX IF EXISTS uq_soap_notes_session_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_soap_notes_session_id`);
    await queryRunner.query(`ALTER TABLE soap_notes DROP COLUMN IF EXISTS session_id`);
  }
}
