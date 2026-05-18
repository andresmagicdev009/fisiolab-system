import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface OtroHeredofamiliar {
  enfermedad: string;
  familiar?: string;
  notas?: string;
}

@Entity('antecedentes_heredofamiliares')
@Index('idx_heredofamiliares_patient', ['patientId'])
export class AntecedentesHeredofamiliar {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId!: string;

  @ApiPropertyOptional() @Column({ default: false }) diabetes!: boolean;
  @ApiPropertyOptional() @Column({ name: 'diabetes_familiar', nullable: true, type: 'varchar', length: 100 }) diabetesFamiliar!: string | null;
  @ApiPropertyOptional() @Column({ name: 'diabetes_notas', nullable: true, type: 'text' }) diabetesNotas!: string | null;

  @ApiPropertyOptional() @Column({ default: false }) hipertension!: boolean;
  @ApiPropertyOptional() @Column({ name: 'hipertension_familiar', nullable: true, type: 'varchar', length: 100 }) hipertensionFamiliar!: string | null;
  @ApiPropertyOptional() @Column({ name: 'hipertension_notas', nullable: true, type: 'text' }) hipertensionNotas!: string | null;

  @ApiPropertyOptional() @Column({ default: false }) cardiopatias!: boolean;
  @ApiPropertyOptional() @Column({ name: 'cardiopatias_familiar', nullable: true, type: 'varchar', length: 100 }) cardiopatiasFamiliar!: string | null;
  @ApiPropertyOptional() @Column({ name: 'cardiopatias_notas', nullable: true, type: 'text' }) cardiopatiasNotas!: string | null;

  @ApiPropertyOptional() @Column({ default: false }) cancer!: boolean;
  @ApiPropertyOptional() @Column({ name: 'cancer_tipo', nullable: true, type: 'varchar', length: 255 }) cancerTipo!: string | null;
  @ApiPropertyOptional() @Column({ name: 'cancer_familiar', nullable: true, type: 'varchar', length: 100 }) cancerFamiliar!: string | null;
  @ApiPropertyOptional() @Column({ name: 'cancer_notas', nullable: true, type: 'text' }) cancerNotas!: string | null;

  @ApiPropertyOptional() @Column({ name: 'enfermedades_respiratorias', default: false }) enfermedadesRespiratorias!: boolean;
  @ApiPropertyOptional() @Column({ name: 'enfermedades_respiratorias_tipo', nullable: true, type: 'varchar', length: 255 }) enfermedadesRespiratoriasTipo!: string | null;
  @ApiPropertyOptional() @Column({ name: 'enfermedades_respiratorias_familiar', nullable: true, type: 'varchar', length: 100 }) enfermedadesRespiratoriasFamiliar!: string | null;
  @ApiPropertyOptional() @Column({ name: 'enfermedades_respiratorias_notas', nullable: true, type: 'text' }) enfermedadesRespiratoriastNotas!: string | null;

  @ApiPropertyOptional() @Column({ name: 'enfermedades_renales', default: false }) enfermedadesRenales!: boolean;
  @ApiPropertyOptional() @Column({ name: 'enfermedades_renales_familiar', nullable: true, type: 'varchar', length: 100 }) enfermedadesRenalesFamiliar!: string | null;
  @ApiPropertyOptional() @Column({ name: 'enfermedades_renales_notas', nullable: true, type: 'text' }) enfermedadesRenalesNotas!: string | null;

  @ApiPropertyOptional() @Column({ name: 'enfermedades_neurologicas', default: false }) enfermedadesNeurologicas!: boolean;
  @ApiPropertyOptional() @Column({ name: 'enfermedades_neurologicas_tipo', nullable: true, type: 'varchar', length: 255 }) enfermedadesNeurologicasTipo!: string | null;
  @ApiPropertyOptional() @Column({ name: 'enfermedades_neurologicas_familiar', nullable: true, type: 'varchar', length: 100 }) enfermedadesNeurologicasFamiliar!: string | null;
  @ApiPropertyOptional() @Column({ name: 'enfermedades_neurologicas_notas', nullable: true, type: 'text' }) enfermedadesNeurologicasNotas!: string | null;

  @ApiPropertyOptional() @Column({ name: 'enfermedades_mentales', default: false }) enfermedadesMentales!: boolean;
  @ApiPropertyOptional() @Column({ name: 'enfermedades_mentales_tipo', nullable: true, type: 'varchar', length: 255 }) enfermedadesMentalesTipo!: string | null;
  @ApiPropertyOptional() @Column({ name: 'enfermedades_mentales_familiar', nullable: true, type: 'varchar', length: 100 }) enfermedadesMentalesFamiliar!: string | null;
  @ApiPropertyOptional() @Column({ name: 'enfermedades_mentales_notas', nullable: true, type: 'text' }) enfermedadesMentalesNotas!: string | null;

  @ApiPropertyOptional({ type: 'array' }) @Column({ type: 'jsonb', nullable: true }) otros!: OtroHeredofamiliar[] | null;

  @Column({ name: 'registrado_por', type: 'uuid', nullable: true }) registradoPorId!: string | null;

  @CreateDateColumn({ name: 'fecha_registro' }) fechaRegistro!: Date;
  @UpdateDateColumn({ name: 'ultima_actualizacion' }) ultimaActualizacion!: Date;
}
