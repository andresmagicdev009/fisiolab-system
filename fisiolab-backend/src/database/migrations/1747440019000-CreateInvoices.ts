import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInvoices1747440019000 implements MigrationInterface {
  name = 'CreateInvoices1747440019000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "invoices" (
        "id"               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "payment_id"       uuid REFERENCES session_payments(id) ON DELETE SET NULL,
        "numero_factura"   varchar(50) UNIQUE,
        "ruc_emisor"       varchar(13),
        "clave_acceso"     varchar(49),
        "autorizacion_sri" varchar(50),
        "xml_factura"      text,
        "created_at"       TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_invoices_payment" ON "invoices" ("payment_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_invoices_numero"  ON "invoices" ("numero_factura")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "invoices"`);
  }
}
