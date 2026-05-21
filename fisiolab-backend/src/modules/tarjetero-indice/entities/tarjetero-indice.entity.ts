import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';

export enum EstadoTarjetero {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
  ARCHIVADO = 'archivado',
}

@Entity('tarjetero_indice')
@Index(['codigoHc'], { unique: true })
@Index(['pacienteId'], { unique: true })
@Index(['anioSecuencia', 'numeroSecuencia'])
export class TarjeteroIndice {
  @ApiProperty({ example: 'c3d4e5f6-a7b8-9012-cdef-012345678901' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: 'HC-2024-0037' })
  @Column({ name: 'codigo_hc', unique: true, length: 15 })
  codigoHc!: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @Column({ name: 'patient_id', type: 'uuid' })
  pacienteId!: string;

  @ManyToOne(() => Patient, { eager: false })
  @JoinColumn({ name: 'patient_id' })
  paciente!: Patient;

  @ApiPropertyOptional({ example: 'b2c3d4e5-f6a7-8901-bcde-f01234567890', nullable: true })
  @Column({ name: 'medico_responsable_id', type: 'uuid', nullable: true })
  medicoResponsableId!: string | null;

  @ApiProperty({ enum: EstadoTarjetero, example: EstadoTarjetero.ACTIVO })
  @Column({ type: 'enum', enum: EstadoTarjetero, default: EstadoTarjetero.ACTIVO })
  estado!: EstadoTarjetero;

  @ApiPropertyOptional({ example: 'Paciente referido por Dr. Ramírez', nullable: true })
  @Column({ nullable: true, type: 'text' })
  observaciones!: string | null;

  @ApiProperty({ example: '2024-03-15' })
  @Column({ name: 'fecha_apertura', type: 'date' })
  fechaApertura!: Date;

  @Column({ name: 'anio_secuencia', type: 'int' })
  anioSecuencia!: number;

  @Column({ name: 'numero_secuencia', type: 'int' })
  numeroSecuencia!: number;

  @ApiProperty({ example: '2024-03-15T10:30:00Z' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-03-15T10:30:00Z' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
