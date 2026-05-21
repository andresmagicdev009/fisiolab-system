import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ClinicalEpisode } from '../../clinical-episodes/entities/clinical-episode.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { Session } from '../../sessions/entities/session.entity';
import type { SoapA, SoapO, SoapP, SoapS } from '../interfaces/soap.interfaces';

@Entity('soap_notes')
@Unique(['episodeId', 'numeroSesion'])
@Index(['episodeId'])
@Index(['pacienteId'])
@Index(['fechaSesion'])
export class SoapNote {
  @ApiProperty({ example: 'e5f6a7b8-c9d0-1234-ef01-234567890123' })
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

  @ApiProperty({ example: 3 })
  @Column({ name: 'numero_sesion', type: 'int' })
  numeroSesion!: number;

  @ApiProperty({ example: '2024-03-20' })
  @Column({ name: 'fecha_sesion', type: 'date' })
  fechaSesion!: Date;

  @ApiProperty()
  @Column({ type: 'jsonb' })
  subjetivo!: SoapS;

  @ApiProperty()
  @Column({ type: 'jsonb' })
  objetivo!: SoapO;

  @ApiProperty()
  @Column({ type: 'jsonb', default: '{}' })
  analisis!: SoapA;

  @ApiProperty()
  @Column({ type: 'jsonb', default: '{}' })
  plan!: SoapP;

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
