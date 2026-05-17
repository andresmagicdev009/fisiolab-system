import { MigrationInterface, QueryRunner } from 'typeorm';

export class DecouplePatientFromUser1747440004000 implements MigrationInterface {
  name = 'DecouplePatientFromUser1747440004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop FK constraint and unique constraint on user_id
    await queryRunner.query(`
      ALTER TABLE "patients"
        DROP CONSTRAINT IF EXISTS "FK_patients_user_id",
        DROP CONSTRAINT IF EXISTS "UQ_patients_user_id"
    `);
    // Make user_id nullable (patient exists without an account)
    await queryRunner.query(`ALTER TABLE "patients" ALTER COLUMN "user_id" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "patients" ALTER COLUMN "user_id" SET NOT NULL`);
    await queryRunner.query(`
      ALTER TABLE "patients"
        ADD CONSTRAINT "FK_patients_user_id"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT
    `);
  }
}
