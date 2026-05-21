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
import { Session } from '../../sessions/entities/session.entity';
import type {
  FuerzaMuscular,
  PruebasEspecificas,
  RangoMovimiento,
} from '../interfaces/evaluation.interfaces';

@Entity('physical_evaluations')
@Index(['episodeId'])
@Index(['pacienteId'])
@Index(['fechaEvaluacion'])
@Index(['profesionalId'])
export class PhysicalEvaluation {
  @ApiProperty({ example: 'f1a2b3c4-d5e6-7890-abcd-ef1234567890' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', nullable: true })
  @Column({ name: 'session_id', type: 'uuid', nullable: true })
  sessionId!: string | null;

  @ManyToOne(() => Session, { eager: false, nullable: true })
  @JoinColumn({ name: 'session_id' })
  session!: Session | null;

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
  @Column({ name: 'numero_evaluacion', type: 'int' })
  numeroEvaluacion!: number;

  @ApiProperty({ example: '2024-03-20' })
  @Column({ name: 'fecha_evaluacion', type: 'date' })
  fechaEvaluacion!: Date;

  @ApiPropertyOptional({
    example: { hombroFlexionD: 120, hombroExtensionD: 50 },
    description: 'Grados por segmento y movimiento — clave libre',
  })
  @Column({ name: 'rango_movimiento', type: 'jsonb', nullable: true })
  rangoMovimiento!: RangoMovimiento | null;

  @ApiPropertyOptional({
    example: { deltoidesD: 4, bicepsD: 5 },
    description: 'Escala MRC 0-5 por músculo',
  })
  @Column({ name: 'fuerza_muscular', type: 'jsonb', nullable: true })
  fuerzaMuscular!: FuerzaMuscular | null;

  @ApiPropertyOptional({ example: 6, minimum: 0, maximum: 10 })
  @Column({ name: 'escala_dolor', type: 'smallint', nullable: true })
  escalaDolor!: number | null;

  @ApiPropertyOptional({
    example: { laségue: { resultado: 'positivo', notas: 'a 45°' } },
    description: 'Pruebas clínicas específicas',
  })
  @Column({ name: 'pruebas_especificas', type: 'jsonb', nullable: true })
  pruebasEspecificas!: PruebasEspecificas | null;

  @ApiPropertyOptional({ example: 'Postura antálgica. Escoliosis funcional leve.' })
  @Column({ name: 'inspeccion', type: 'text', nullable: true })
  inspeccion!: string | null;

  @ApiPropertyOptional({ example: 'Dolor a palpación L4-L5. Contractura paravertebral.' })
  @Column({ name: 'palpacion', type: 'text', nullable: true })
  palpacion!: string | null;

  @ApiPropertyOptional({ example: 'Síndrome doloroso lumbar crónico con limitación funcional moderada.' })
  @Column({ name: 'diagnostico', type: 'text', nullable: true })
  diagnostico!: string | null;

  @ApiPropertyOptional({ example: 'Paciente colaborador. Refiere mejoría respecto a evaluación inicial.' })
  @Column({ name: 'observaciones', type: 'text', nullable: true })
  observaciones!: string | null;

  @ApiProperty({ example: '2024-03-20T10:30:00Z' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-03-20T10:30:00Z' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
