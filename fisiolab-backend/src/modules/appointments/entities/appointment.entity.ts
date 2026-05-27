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

export enum TipoCita {
  PRIMERA_VEZ   = 'PRIMERA_VEZ',
  SEGUIMIENTO   = 'SEGUIMIENTO',
  INTERCONSULTA = 'INTERCONSULTA',
}

export enum EstadoCita {
  CONFIRMADA   = 'CONFIRMADA',
  CANCELADA    = 'CANCELADA',
  COMPLETADA   = 'COMPLETADA',
  REPROGRAMADA = 'REPROGRAMADA',
  NO_ASISTIO   = 'NO_ASISTIO',
}

export enum AppointmentBookingType {
  SDA        = 'sda',
  PRE_BOOK   = 'pre_book',
  EMERGENCIA = 'emergencia',
}

@Entity('appointments')
@Index(['patientId'])
@Index(['professionalId'])
@Index(['scheduledAt'])
@Index(['estado'])
export class Appointment {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f01234567890' })
  @Column({ name: 'patient_id', type: 'uuid' })
  patientId!: string;

  @ManyToOne(() => Patient, { eager: false })
  @JoinColumn({ name: 'patient_id' })
  patient!: Patient;

  @ApiProperty({ example: 'c3d4e5f6-a7b8-9012-cdef-012345678901' })
  @Column({ name: 'professional_id', type: 'uuid' })
  professionalId!: string;

  @ApiProperty({ example: '2024-03-20T10:00:00Z' })
  @Column({ name: 'scheduled_at', type: 'timestamptz' })
  scheduledAt!: Date;

  @ApiProperty({ example: 60 })
  @Column({ name: 'duration_minutes', type: 'int', default: 60 })
  durationMinutes!: number;

  @ApiProperty({ enum: TipoCita, example: TipoCita.PRIMERA_VEZ })
  @Column({ name: 'tipo_cita', type: 'enum', enum: TipoCita })
  tipoCita!: TipoCita;

  @ApiProperty({ enum: EstadoCita, example: EstadoCita.CONFIRMADA })
  @Column({ type: 'enum', enum: EstadoCita, default: EstadoCita.CONFIRMADA })
  estado!: EstadoCita;

  @ApiPropertyOptional({ example: 'Dolor lumbar crónico con irradiación', nullable: true })
  @Column({ type: 'text', nullable: true })
  motivo!: string | null;

  @ApiPropertyOptional({ example: 'Traer estudios previos de columna.', nullable: true })
  @Column({ type: 'text', nullable: true })
  notas!: string | null;

  @ApiPropertyOptional({ example: 'Paciente no se presentó sin aviso previo.', nullable: true })
  @Column({ name: 'motivo_cancelacion', type: 'text', nullable: true })
  motivoCancelacion!: string | null;

  @ApiPropertyOptional({ example: 'd4e5f6a7-b8c9-0123-def0-123456789012', nullable: true })
  @Column({ name: 'episode_id', type: 'uuid', nullable: true })
  episodeId!: string | null;

  @ApiPropertyOptional({ example: 'e5f6a7b8-c9d0-1234-ef01-234567890123', nullable: true })
  @Column({ name: 'session_payment_id', type: 'uuid', nullable: true })
  sessionPaymentId!: string | null;

  @ApiPropertyOptional({
    example: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    nullable: true,
    description: 'Sesión vinculada (citas creadas desde un plan)',
  })
  @Column({ name: 'session_id', type: 'uuid', nullable: true })
  sessionId!: string | null;

  @ApiPropertyOptional({
    example: 'ffffffff-1111-2222-3333-444444444444',
    nullable: true,
    description: 'Plan de tratamiento vinculado',
  })
  @Column({ name: 'treatment_plan_id', type: 'uuid', nullable: true })
  treatmentPlanId!: string | null;

  @ApiPropertyOptional({ example: 'f1a2b3c4-d5e6-7890-abcd-ef1234567890', nullable: true })
  @Column({ name: 'reprogramada_de_id', type: 'uuid', nullable: true })
  reprogramadaDeId!: string | null;

  @ApiPropertyOptional({ example: 'a2b3c4d5-e6f7-8901-bcde-f01234567890', nullable: true })
  @Column({ name: 'nueva_cita_id', type: 'uuid', nullable: true })
  nuevaCitaId!: string | null;

  @ApiPropertyOptional({ example: 'Paciente solicita cambio de horario', nullable: true })
  @Column({ name: 'motivo_reprogramacion', type: 'varchar', length: 500, nullable: true })
  motivoReprogramacion!: string | null;

  @ApiProperty({ enum: AppointmentBookingType, example: AppointmentBookingType.PRE_BOOK })
  @Column({ name: 'booking_type', type: 'enum', enum: AppointmentBookingType, default: AppointmentBookingType.PRE_BOOK })
  bookingType!: AppointmentBookingType;

  @ApiProperty({ example: 0, description: 'Veces que ha sido reagendada. Límite: 3.' })
  @Column({ name: 'intentos_reagendamiento', type: 'int', default: 0 })
  intentosReagendamiento!: number;

  @ApiProperty({ example: false })
  @Column({ name: 'es_reprog_no_show', type: 'boolean', default: false })
  esReprogNoShow!: boolean;

  @ApiProperty({ example: '2024-03-20T10:30:00Z' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-03-20T10:30:00Z' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
