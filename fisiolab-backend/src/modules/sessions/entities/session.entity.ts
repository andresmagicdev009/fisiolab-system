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
import { ClinicalEpisode } from '../../clinical-episodes/entities/clinical-episode.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { TreatmentPlan } from '../../treatment-plans/entities/treatment-plan.entity';

export enum TipoSesion {
  FISIOTERAPIA      = 'FISIOTERAPIA',
  EVALUACION_FISICA = 'EVALUACION_FISICA',
  INTERCONSULTA     = 'INTERCONSULTA',
  CONSULTA_MEDICA   = 'CONSULTA_MEDICA',
}

export enum EstadoSesion {
  PROGRAMADA  = 'PROGRAMADA',
  EN_CURSO    = 'EN_CURSO',
  COMPLETADA  = 'COMPLETADA',
  CANCELADA   = 'CANCELADA',
}

@Entity('sessions')
@Index(['planId'])
@Index(['episodeId'])
@Index(['pacienteId'])
@Index(['fechaSesion'])
@Index(['estado'])
export class Session {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiPropertyOptional({ example: 'f1a2b3c4-d5e6-7890-abcd-ef1234567890', nullable: true })
  @Column({ name: 'plan_id', type: 'uuid', nullable: true })
  planId!: string | null;

  @ManyToOne(() => TreatmentPlan, { eager: false, nullable: true })
  @JoinColumn({ name: 'plan_id' })
  plan!: TreatmentPlan | null;

  @ApiProperty({ example: 'd4e5f6a7-b8c9-0123-def0-123456789012' })
  @Column({ name: 'episode_id', type: 'uuid' })
  episodeId!: string;

  @ManyToOne(() => ClinicalEpisode, { eager: false })
  @JoinColumn({ name: 'episode_id' })
  episode!: ClinicalEpisode;

  @ApiProperty({ example: 'HC-2024-0037' })
  @Column({ name: 'codigo_hc', type: 'varchar', length: 15 })
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

  @ApiProperty({ enum: TipoSesion, example: TipoSesion.FISIOTERAPIA })
  @Column({ type: 'varchar', length: 30 })
  tipo!: TipoSesion;

  @ApiProperty({ enum: EstadoSesion, example: EstadoSesion.PROGRAMADA })
  @Column({ type: 'varchar', length: 20, default: EstadoSesion.PROGRAMADA })
  estado!: EstadoSesion;

  @ApiProperty({ example: 3 })
  @Column({ name: 'numero_sesion', type: 'int' })
  numeroSesion!: number;

  @ApiProperty({ example: '2024-03-20' })
  @Column({ name: 'fecha_sesion', type: 'date' })
  fechaSesion!: Date;

  @ApiPropertyOptional({ example: 'c3d4e5f6-a7b8-9012-cdef-012345678901', nullable: true })
  @Column({ name: 'appointment_id', type: 'uuid', nullable: true })
  appointmentId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  @Column({ type: 'text', nullable: true })
  observaciones!: string | null;

  @ApiProperty({ example: '2024-03-20T10:30:00Z' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-03-20T10:30:00Z' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
