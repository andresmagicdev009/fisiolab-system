import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
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
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Exclude()
  @Column({ name: 'user_id', nullable: true, type: 'uuid' })
  userId!: string | null;

  @ApiProperty({ example: '1713175071' })
  @Column({ unique: true, length: 10 })
  cedula!: string;

  @ApiProperty({ example: 'Juan Carlos' })
  @Column({ length: 100 })
  nombres!: string;

  @ApiProperty({ example: 'Rodríguez Pérez' })
  @Column({ length: 100 })
  apellidos!: string;

  @ApiPropertyOptional({ example: 'juan@email.com', nullable: true })
  @Column({ nullable: true, type: 'varchar', length: 150 })
  email!: string | null;

  @ApiProperty({ example: '1990-05-20' })
  @Column({ name: 'fecha_nacimiento', type: 'date' })
  fechaNacimiento!: Date;

  @ApiProperty({ enum: Genero, example: Genero.MASCULINO })
  @Column({ type: 'enum', enum: Genero })
  genero!: Genero;

  @ApiPropertyOptional({ example: '0991234567', nullable: true })
  @Column({ nullable: true, type: 'varchar', length: 15 })
  telefono!: string | null;

  @ApiPropertyOptional({ example: '0987654321', nullable: true })
  @Column({ name: 'telefono_emergencia', nullable: true, type: 'varchar', length: 15 })
  telefonoEmergencia!: string | null;

  @ApiPropertyOptional({ example: 'Av. 6 de Diciembre N24-567', nullable: true })
  @Column({ nullable: true, type: 'varchar', length: 255 })
  direccion!: string | null;

  @ApiPropertyOptional({ example: 'Quito', nullable: true })
  @Column({ nullable: true, type: 'varchar', length: 100 })
  ciudad!: string | null;

  @ApiPropertyOptional({ example: 'Pichincha', nullable: true })
  @Column({ nullable: true, type: 'varchar', length: 100 })
  provincia!: string | null;

  @ApiPropertyOptional({ example: '170150', nullable: true })
  @Column({ name: 'codigo_postal', nullable: true, type: 'varchar', length: 10 })
  codigoPostal!: string | null;

  @ApiPropertyOptional({ example: 'Ingeniero', nullable: true })
  @Column({ nullable: true, type: 'varchar', length: 100 })
  ocupacion!: string | null;

  @ApiPropertyOptional({ enum: EstadoCivil, example: EstadoCivil.SOLTERO, nullable: true })
  @Column({ name: 'estado_civil', type: 'enum', enum: EstadoCivil, nullable: true })
  estadoCivil!: EstadoCivil | null;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
