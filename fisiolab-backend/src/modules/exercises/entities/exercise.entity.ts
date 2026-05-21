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
import { TreatmentPlan } from '../../treatment-plans/entities/treatment-plan.entity';

export enum TipoEjercicio {
  REPETICIONES = 'repeticiones',
  TIEMPO = 'tiempo',
  CARDIO = 'cardio',
  LIBRE = 'libre',
}

@Entity('exercises')
@Index(['planId'])
export class Exercise {
  @ApiProperty({ example: 'e1a2b3c4-d5e6-7890-abcd-ef1234567890' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: 'f1a2b3c4-d5e6-7890-abcd-ef1234567890' })
  @Column({ name: 'plan_id', type: 'uuid' })
  planId!: string;

  @ManyToOne(() => TreatmentPlan, (plan) => plan.exercises, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plan_id' })
  plan!: TreatmentPlan;

  @ApiProperty({ enum: TipoEjercicio, default: TipoEjercicio.REPETICIONES })
  @Column({
    name: 'tipo_ejercicio',
    type: 'enum',
    enum: TipoEjercicio,
    default: TipoEjercicio.REPETICIONES,
  })
  tipoEjercicio!: TipoEjercicio;

  @ApiProperty({ example: 'Puente glúteo' })
  @Column({ type: 'varchar', length: 255 })
  nombre!: string;

  @ApiPropertyOptional({ example: 'Decúbito supino, elevar pelvis contrayendo glúteos.' })
  @Column({ type: 'text', nullable: true })
  descripcion!: string | null;

  @ApiPropertyOptional({ example: 3 })
  @Column({ type: 'smallint', nullable: true })
  series!: number | null;

  @ApiPropertyOptional({ example: 15 })
  @Column({ type: 'smallint', nullable: true })
  repeticiones!: number | null;

  @ApiPropertyOptional({ example: 30, description: 'Duración en segundos' })
  @Column({ name: 'duracion_segundos', type: 'smallint', nullable: true })
  duracionSegundos!: number | null;

  @ApiProperty({ example: 1, description: 'Posición en el plan' })
  @Column({ type: 'smallint' })
  orden!: number;

  @ApiPropertyOptional({ example: 'Mantener espalda plana. No hiperlordosis.' })
  @Column({ type: 'text', nullable: true })
  observaciones!: string | null;

  @ApiProperty({ example: '2024-03-20T10:30:00Z' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-03-20T10:30:00Z' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
