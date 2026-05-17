import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum Genero {
  MASCULINO = 'masculino',
  FEMENINO = 'femenino',
  OTRO = 'otro',
}

export enum EstadoCivil {
  SOLTERO = 'soltero',
  CASADO = 'casado',
  DIVORCIADO = 'divorciado',
  VIUDO = 'viudo',
  UNION_LIBRE = 'union_libre',
}

@Entity('patients')
@Index(['cedula'], { unique: true })
@Index(['email'])
@Index(['nombres'])
@Index(['apellidos'])
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Optional link to a Clerk user account — null until patient self-registers */
  @Column({ name: 'user_id', nullable: true, type: 'uuid' })
  userId!: string | null;

  @Column({ unique: true, length: 10 })
  cedula!: string;

  @Column({ length: 100 })
  nombres!: string;

  @Column({ length: 100 })
  apellidos!: string;

  @Column({ nullable: true, type: 'varchar', length: 150 })
  email!: string | null;

  @Column({ name: 'fecha_nacimiento', type: 'date' })
  fechaNacimiento!: Date;

  @Column({ type: 'enum', enum: Genero })
  genero!: Genero;

  @Column({ nullable: true, type: 'varchar', length: 15 })
  telefono!: string | null;

  @Column({ name: 'telefono_emergencia', nullable: true, type: 'varchar', length: 15 })
  telefonoEmergencia!: string | null;

  @Column({ nullable: true, type: 'varchar', length: 255 })
  direccion!: string | null;

  @Column({ nullable: true, type: 'varchar', length: 100 })
  ciudad!: string | null;

  @Column({ nullable: true, type: 'varchar', length: 100 })
  provincia!: string | null;

  @Column({ name: 'codigo_postal', nullable: true, type: 'varchar', length: 10 })
  codigoPostal!: string | null;

  @Column({ nullable: true, type: 'varchar', length: 100 })
  ocupacion!: string | null;

  @Column({ name: 'estado_civil', type: 'enum', enum: EstadoCivil, nullable: true })
  estadoCivil!: EstadoCivil | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
