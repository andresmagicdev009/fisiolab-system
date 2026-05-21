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

export enum EstadoInterconsulta {
  SOLICITADA = 'SOLICITADA',
  EN_PROCESO = 'EN_PROCESO',
  RESPONDIDA = 'RESPONDIDA',
}

@Entity('interconsults')
@Index(['episodeId'])
@Index(['solicitanteId'])
@Index(['destinatarioId'])
@Index(['estado'])
@Index(['pacienteId'])
export class Interconsult {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
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

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f01234567890', description: 'Profesional que solicita' })
  @Column({ name: 'solicitante_id', type: 'uuid' })
  solicitanteId!: string;

  @ApiProperty({ example: 'c3d4e5f6-a7b8-9012-cdef-012345678901', description: 'Profesional destinatario' })
  @Column({ name: 'destinatario_id', type: 'uuid' })
  destinatarioId!: string;

  @ApiProperty({ example: 'Evaluación neurológica por radiculopatía L4-L5 refractaria a tratamiento.' })
  @Column({ type: 'text' })
  motivo!: string;

  @ApiPropertyOptional({ example: 'ROM lumbar: flexión 40°. Lasègue (+) 30° derecho. EVA 7/10.', nullable: true })
  @Column({ name: 'hallazgos_relevantes', type: 'text', nullable: true })
  hallazgosRelevantes!: string | null;

  @ApiPropertyOptional({ example: '¿Existe componente discal que requiera manejo quirúrgico?', nullable: true })
  @Column({ name: 'pregunta_clinica', type: 'text', nullable: true })
  preguntaClinica!: string | null;

  @ApiProperty({ enum: EstadoInterconsulta, example: EstadoInterconsulta.SOLICITADA })
  @Column({ type: 'enum', enum: EstadoInterconsulta, default: EstadoInterconsulta.SOLICITADA })
  estado!: EstadoInterconsulta;

  @ApiPropertyOptional({ example: 'IRM confirma hernia discal L4-L5. Recomiendo manejo conservador 6 semanas.', nullable: true })
  @Column({ type: 'text', nullable: true })
  respuesta!: string | null;

  @ApiPropertyOptional({ example: '2024-03-25T14:30:00Z', nullable: true })
  @Column({ name: 'fecha_respuesta', type: 'timestamptz', nullable: true })
  fechaRespuesta!: Date | null;

  @ApiProperty({ example: '2024-03-20T10:30:00Z' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-03-20T10:30:00Z' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
