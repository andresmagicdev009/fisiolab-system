import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ClinicalEpisode } from '../../clinical-episodes/entities/clinical-episode.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { Exercise } from '../../exercises/entities/exercise.entity';

export enum EstadoPlan {
  ACTIVO = 'activo',
  COMPLETADO = 'completado',
  CANCELADO = 'cancelado',
}

@Entity('treatment_plans')
@Index(['episodeId'])
@Index(['pacienteId'])
@Index(['profesionalId'])
export class TreatmentPlan {
  @ApiProperty({ example: 'f1a2b3c4-d5e6-7890-abcd-ef1234567890' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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

  @ApiProperty({ example: 1 })
  @Column({ name: 'numero_plan', type: 'int' })
  numeroPlan!: number;

  @ApiProperty({ enum: EstadoPlan, example: EstadoPlan.ACTIVO })
  @Column({ type: 'enum', enum: EstadoPlan, default: EstadoPlan.ACTIVO })
  estado!: EstadoPlan;

  @ApiProperty({ example: 'Recuperar ROM completo de hombro y fuerza muscular grado 5.' })
  @Column({ name: 'objetivo_terapeutico', type: 'text' })
  objetivoTerapeutico!: string;

  @ApiPropertyOptional({ example: 4, nullable: true })
  @Column({ name: 'duracion_estimada_semanas', type: 'smallint', nullable: true })
  duracionEstimadaSemanas!: number | null;

  @ApiPropertyOptional({ example: 3, nullable: true, description: 'Sesiones por semana' })
  @Column({ name: 'frecuencia_semanal', type: 'smallint', nullable: true })
  frecuenciaSemanal!: number | null;

  @ApiPropertyOptional({ example: '2024-03-20', nullable: true })
  @Column({ name: 'fecha_inicio', type: 'date', nullable: true })
  fechaInicio!: Date | null;

  @ApiPropertyOptional({ example: '2024-04-17', nullable: true })
  @Column({ name: 'fecha_fin', type: 'date', nullable: true })
  fechaFin!: Date | null;

  @ApiProperty({ example: 40, minimum: 0, maximum: 100, default: 0 })
  @Column({ name: 'progreso_porcentaje', type: 'decimal', precision: 5, scale: 2, default: 0 })
  progresoPorcentaje!: number;

  @ApiPropertyOptional({ example: 'uuid-cita', nullable: true, description: 'Cita de inicio del plan (opcional)' })
  @Column({ name: 'appointment_id', type: 'uuid', nullable: true })
  appointmentId!: string | null;

  @ApiPropertyOptional({ example: 'Iniciar con ejercicios en cadena cinética cerrada.', nullable: true })
  @Column({ type: 'text', nullable: true })
  observaciones!: string | null;

  @ApiProperty({ type: () => [Exercise] })
  @OneToMany(() => Exercise, (ex) => ex.plan, { cascade: ['insert', 'update'] })
  exercises!: Exercise[];

  @ApiProperty({ example: '2024-03-20T10:30:00Z' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-03-20T10:30:00Z' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
