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
import { TarjeteroIndice } from '../../tarjetero-indice/entities/tarjetero-indice.entity';

export enum EstadoEpisodio {
  ABIERTO = 'abierto',
  EN_TRATAMIENTO = 'en_tratamiento',
  CERRADO = 'cerrado',
  ARCHIVADO = 'archivado',
}

@Entity('clinical_episodes')
@Index(['pacienteId'])
@Index(['profesionalId'])
@Index(['estado'])
@Index(['fechaApertura'])
export class ClinicalEpisode {
  @ApiProperty({ example: 'd4e5f6a7-b8c9-0123-def0-123456789012' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: 'c3d4e5f6-a7b8-9012-cdef-012345678901' })
  @Column({ name: 'tarjetero_id', type: 'uuid' })
  tarjeteroId!: string;

  @ManyToOne(() => TarjeteroIndice, { eager: false })
  @JoinColumn({ name: 'tarjetero_id' })
  tarjetero!: TarjeteroIndice;

  @ApiProperty({ example: 'HC-2024-0037' })
  @Column({ name: 'codigo_hc', length: 15 })
  codigoHc!: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @Column({ name: 'patient_id', type: 'uuid' })
  pacienteId!: string;

  @ManyToOne(() => Patient, { eager: false })
  @JoinColumn({ name: 'patient_id' })
  paciente!: Patient;

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f01234567890' })
  @Column({ name: 'profesional_id', type: 'uuid' })
  profesionalId!: string;

  @ApiProperty({ enum: EstadoEpisodio, example: EstadoEpisodio.ABIERTO })
  @Column({ type: 'enum', enum: EstadoEpisodio, default: EstadoEpisodio.ABIERTO })
  estado!: EstadoEpisodio;

  @ApiProperty({ example: 'Dolor lumbar crónico con irradiación a miembro inferior derecho' })
  @Column({ name: 'motivo_consulta', length: 500 })
  motivoConsulta!: string;

  @ApiPropertyOptional({ example: 'Lumbalgia mecánica con radiculopatía L4-L5', nullable: true })
  @Column({ name: 'diagnostico_principal', type: 'varchar', length: 255, nullable: true })
  diagnosticoPrincipal!: string | null;

  @ApiPropertyOptional({ example: 'M51.1', nullable: true })
  @Column({ name: 'codigo_cie10', type: 'varchar', length: 10, nullable: true })
  codigoCie10!: string | null;

  @ApiPropertyOptional({ example: 'HTA controlada', nullable: true })
  @Column({ name: 'diagnostico_secundario', type: 'varchar', length: 255, nullable: true })
  diagnosticoSecundario!: string | null;

  @ApiPropertyOptional({ nullable: true })
  @Column({ name: 'nota_apertura', type: 'text', nullable: true })
  notaApertura!: string | null;

  @ApiPropertyOptional({ nullable: true })
  @Column({ name: 'nota_cierre', type: 'text', nullable: true })
  notaCierre!: string | null;

  @ApiProperty({ example: '2024-03-15' })
  @Column({ name: 'fecha_apertura', type: 'date' })
  fechaApertura!: Date;

  @ApiPropertyOptional({ example: '2024-04-10', nullable: true })
  @Column({ name: 'fecha_cierre', type: 'date', nullable: true })
  fechaCierre!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  @Column({ name: 'appointment_id', type: 'uuid', nullable: true, default: null })
  appointmentId!: string | null;

  @ApiProperty({ example: '2024-03-15T10:30:00Z' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-03-15T10:30:00Z' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
