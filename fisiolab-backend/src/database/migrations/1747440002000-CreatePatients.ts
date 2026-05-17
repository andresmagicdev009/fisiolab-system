import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreatePatients1747440002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'patients',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'user_id', type: 'uuid', isUnique: true },
          { name: 'cedula', type: 'varchar', length: '10', isUnique: true },
          { name: 'nombres', type: 'varchar', length: '100' },
          { name: 'apellidos', type: 'varchar', length: '100' },
          { name: 'email', type: 'varchar', length: '150', isNullable: true },
          { name: 'fecha_nacimiento', type: 'date' },
          {
            name: 'genero',
            type: 'enum',
            enum: ['masculino', 'femenino', 'otro'],
          },
          { name: 'telefono', type: 'varchar', length: '15', isNullable: true },
          { name: 'telefono_emergencia', type: 'varchar', length: '15', isNullable: true },
          { name: 'direccion', type: 'varchar', length: '255', isNullable: true },
          { name: 'ciudad', type: 'varchar', length: '100', isNullable: true },
          { name: 'provincia', type: 'varchar', length: '100', isNullable: true },
          { name: 'codigo_postal', type: 'varchar', length: '10', isNullable: true },
          { name: 'ocupacion', type: 'varchar', length: '100', isNullable: true },
          {
            name: 'estado_civil',
            type: 'enum',
            enum: ['soltero', 'casado', 'divorciado', 'viudo', 'union_libre'],
            isNullable: true,
          },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'RESTRICT',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex('patients', new TableIndex({ name: 'IDX_patients_cedula', columnNames: ['cedula'] }));
    await queryRunner.createIndex('patients', new TableIndex({ name: 'IDX_patients_email', columnNames: ['email'] }));
    await queryRunner.createIndex('patients', new TableIndex({ name: 'IDX_patients_nombres', columnNames: ['nombres'] }));
    await queryRunner.createIndex('patients', new TableIndex({ name: 'IDX_patients_apellidos', columnNames: ['apellidos'] }));

    // Trigger to auto-update updated_at on direct SQL updates (TypeORM handles ORM-level)
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER patients_updated_at
      BEFORE UPDATE ON patients
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TRIGGER IF EXISTS patients_updated_at ON patients');
    await queryRunner.query('DROP FUNCTION IF EXISTS update_updated_at_column');
    await queryRunner.dropTable('patients');
  }
}
