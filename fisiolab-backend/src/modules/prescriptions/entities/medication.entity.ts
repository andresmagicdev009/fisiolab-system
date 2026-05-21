import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum FormaFarmaceutica {
  TABLETA = 'tableta',
  CAPSULA = 'capsula',
  JARABE = 'jarabe',
  AMPOLLA = 'ampolla',
  CREMA = 'crema',
  PARCHE = 'parche',
  COLIRIO = 'colirio',
  GOTAS = 'gotas',
  SUPOSITORIO = 'supositorio',
  POLVO = 'polvo',
  AEROSOL = 'aerosol',
  OTRO = 'otro',
}

export enum ViaAdministracion {
  ORAL = 'oral',
  INTRAVENOSA = 'intravenosa',
  INTRAMUSCULAR = 'intramuscular',
  SUBCUTANEA = 'subcutanea',
  TOPICA = 'topica',
  INHALATORIA = 'inhalatoria',
  RECTAL = 'rectal',
  OCULAR = 'ocular',
  OTRO = 'otro',
}

@Entity('medications')
@Index(['prescriptionId'])
export class Medication {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f01234567890' })
  @Column({ name: 'prescription_id', type: 'uuid' })
  prescriptionId!: string;

  @ApiProperty({ example: 1 })
  @Column({ type: 'smallint', default: 1 })
  orden!: number;

  @ApiProperty({ example: 'Ibuprofeno' })
  @Column({ name: 'principio_activo', type: 'varchar', length: 255 })
  principioActivo!: string;

  @ApiPropertyOptional({ example: 'Advil' })
  @Column({ name: 'nombre_comercial', type: 'varchar', length: 255, nullable: true })
  nombreComercial!: string | null;

  @ApiPropertyOptional({ example: '400mg' })
  @Column({ type: 'varchar', length: 100, nullable: true })
  concentracion!: string | null;

  @ApiPropertyOptional({ enum: FormaFarmaceutica })
  @Column({ name: 'forma_farmaceutica', type: 'enum', enum: FormaFarmaceutica, nullable: true })
  formaFarmaceutica!: FormaFarmaceutica | null;

  @ApiPropertyOptional({ example: '1 tableta' })
  @Column({ type: 'varchar', length: 100, nullable: true })
  dosis!: string | null;

  @ApiPropertyOptional({ enum: ViaAdministracion, default: ViaAdministracion.ORAL })
  @Column({ name: 'via_administracion', type: 'enum', enum: ViaAdministracion, default: ViaAdministracion.ORAL })
  viaAdministracion!: ViaAdministracion;

  @ApiPropertyOptional({ example: 'Cada 8 horas' })
  @Column({ type: 'varchar', length: 100, nullable: true })
  frecuencia!: string | null;

  @ApiPropertyOptional({ example: 5, description: 'Duración en días' })
  @Column({ name: 'duracion_dias', type: 'smallint', nullable: true })
  duracionDias!: number | null;

  @ApiPropertyOptional({ example: 'Tomar con alimentos. No superar 3 dosis diarias.' })
  @Column({ type: 'text', nullable: true })
  indicaciones!: string | null;

  @ApiProperty({ example: '2024-03-20T10:30:00Z' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-03-20T10:30:00Z' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
