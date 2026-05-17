import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProfessionalFieldsToUsers1747440003000 implements MigrationInterface {
  name = 'AddProfessionalFieldsToUsers1747440003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "external_auth_id" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "users" ADD "nombres" character varying(100)`);
    await queryRunner.query(`ALTER TABLE "users" ADD "apellidos" character varying(100)`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "cedula" TYPE character varying(10)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "cedula" TYPE character varying`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "apellidos"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "nombres"`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "external_auth_id" SET NOT NULL`);
  }
}
