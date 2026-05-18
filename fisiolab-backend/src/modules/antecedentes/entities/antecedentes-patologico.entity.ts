import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum DiabetesTipo { TIPO_1 = 'TIPO_1', TIPO_2 = 'TIPO_2', GESTACIONAL = 'GESTACIONAL', OTRO = 'OTRO' }
export enum HepatitisTipo { A = 'A', B = 'B', C = 'C', D = 'D', E = 'E' }
export enum Covid19Severidad { LEVE = 'LEVE', MODERADO = 'MODERADO', SEVERO = 'SEVERO', CRITICO = 'CRITICO' }
export enum AcvTipo { ISQUEMICO = 'ISQUEMICO', HEMORRAGICO = 'HEMORRAGICO' }

@Entity('antecedentes_personales_patologicos')
@Index('idx_patologicos_patient', ['patientId'])
export class AntecedentesPatologico {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'patient_id', type: 'uuid' }) patientId!: string;

  // Diabetes
  @ApiPropertyOptional() @Column({ name: 'diabetes_mellitus', default: false }) diabetesMellitus!: boolean;
  @ApiPropertyOptional({ enum: DiabetesTipo }) @Column({ name: 'diabetes_tipo', type: 'varchar', nullable: true }) diabetesTipo!: DiabetesTipo | null;
  @ApiPropertyOptional() @Column({ name: 'diabetes_anio_diagnostico', type: 'int', nullable: true }) diabetesAnioDiagnostico!: number | null;
  @ApiPropertyOptional() @Column({ name: 'diabetes_tratamiento', type: 'text', nullable: true }) diabetesTratamiento!: string | null;
  @ApiPropertyOptional() @Column({ name: 'diabetes_controlada', type: 'boolean', nullable: true }) diabetesControlada!: boolean | null;

  // Hipertension
  @ApiPropertyOptional() @Column({ name: 'hipertension_arterial', default: false }) hipertensionArterial!: boolean;
  @ApiPropertyOptional() @Column({ name: 'hipertension_anio_diagnostico', type: 'int', nullable: true }) hipertensionAnioDiagnostico!: number | null;
  @ApiPropertyOptional() @Column({ name: 'hipertension_tratamiento', type: 'text', nullable: true }) hipertensionTratamiento!: string | null;
  @ApiPropertyOptional() @Column({ name: 'hipertension_controlada', type: 'boolean', nullable: true }) hipertensionControlada!: boolean | null;

  // Cardiopatias
  @ApiPropertyOptional() @Column({ default: false }) cardiopatias!: boolean;
  @ApiPropertyOptional() @Column({ name: 'cardiopatias_tipo', nullable: true, type: 'varchar', length: 255 }) cardiopatiasTipo!: string | null;
  @ApiPropertyOptional() @Column({ name: 'cardiopatias_anio_diagnostico', type: 'int', nullable: true }) cardiopatiasAnioDiagnostico!: number | null;
  @ApiPropertyOptional() @Column({ name: 'cardiopatias_tratamiento', type: 'text', nullable: true }) cardiopatiasTratamiento!: string | null;

  // Respiratorias
  @ApiPropertyOptional() @Column({ name: 'enfermedades_respiratorias', default: false }) enfermedadesRespiratorias!: boolean;
  @ApiPropertyOptional() @Column({ name: 'enfermedades_respiratorias_tipo', nullable: true, type: 'varchar', length: 255 }) enfermedadesRespiratoriasTipo!: string | null;
  @ApiPropertyOptional() @Column({ name: 'enfermedades_respiratorias_anio_diagnostico', type: 'int', nullable: true }) enfermedadesRespiratoriasAnioDiagnostico!: number | null;
  @ApiPropertyOptional() @Column({ name: 'enfermedades_respiratorias_tratamiento', type: 'text', nullable: true }) enfermedadesRespiratoriasTratamiento!: string | null;

  // Renales
  @ApiPropertyOptional() @Column({ name: 'enfermedades_renales', default: false }) enfermedadesRenales!: boolean;
  @ApiPropertyOptional() @Column({ name: 'enfermedades_renales_tipo', nullable: true, type: 'varchar', length: 255 }) enfermedadesRenalesTipo!: string | null;
  @ApiPropertyOptional() @Column({ name: 'enfermedades_renales_anio_diagnostico', type: 'int', nullable: true }) enfermedadesRenalesAnioDiagnostico!: number | null;
  @ApiPropertyOptional() @Column({ name: 'enfermedades_renales_tratamiento', type: 'text', nullable: true }) enfermedadesRenalesTratamiento!: string | null;

  // Cancer
  @ApiPropertyOptional() @Column({ default: false }) cancer!: boolean;
  @ApiPropertyOptional() @Column({ name: 'cancer_tipo', nullable: true, type: 'varchar', length: 255 }) cancerTipo!: string | null;
  @ApiPropertyOptional() @Column({ name: 'cancer_anio_diagnostico', type: 'int', nullable: true }) cancerAnioDiagnostico!: number | null;
  @ApiPropertyOptional() @Column({ name: 'cancer_tratamiento', type: 'text', nullable: true }) cancerTratamiento!: string | null;
  @ApiPropertyOptional() @Column({ name: 'cancer_remision', type: 'boolean', nullable: true }) cancerRemision!: boolean | null;

  // Tuberculosis
  @ApiPropertyOptional() @Column({ default: false }) tuberculosis!: boolean;
  @ApiPropertyOptional() @Column({ name: 'tuberculosis_anio', type: 'int', nullable: true }) tuberculosisAnio!: number | null;
  @ApiPropertyOptional() @Column({ name: 'tuberculosis_tratamiento_completo', type: 'boolean', nullable: true }) tuberculosisTratamientoCompleto!: boolean | null;

  // Hepatitis
  @ApiPropertyOptional() @Column({ default: false }) hepatitis!: boolean;
  @ApiPropertyOptional({ enum: HepatitisTipo }) @Column({ name: 'hepatitis_tipo', type: 'varchar', nullable: true }) hepatitisTipo!: HepatitisTipo | null;
  @ApiPropertyOptional() @Column({ name: 'hepatitis_anio', type: 'int', nullable: true }) hepatitisAnio!: number | null;

  // VIH
  @ApiPropertyOptional() @Column({ name: 'vih_sida', default: false }) vihSida!: boolean;
  @ApiPropertyOptional() @Column({ name: 'vih_anio_diagnostico', type: 'int', nullable: true }) vihAnioDiagnostico!: number | null;
  @ApiPropertyOptional() @Column({ name: 'vih_tratamiento_antirretroviral', type: 'boolean', nullable: true }) vihTratamientoAntirretroviral!: boolean | null;

  // COVID-19
  @ApiPropertyOptional() @Column({ default: false }) covid19!: boolean;
  @ApiPropertyOptional() @Column({ name: 'covid19_fecha', type: 'date', nullable: true }) covid19Fecha!: Date | null;
  @ApiPropertyOptional({ enum: Covid19Severidad }) @Column({ name: 'covid19_severidad', type: 'varchar', nullable: true }) covid19Severidad!: Covid19Severidad | null;
  @ApiPropertyOptional() @Column({ name: 'covid19_secuelas', type: 'text', nullable: true }) covid19Secuelas!: string | null;

  // Epilepsia
  @ApiPropertyOptional() @Column({ default: false }) epilepsia!: boolean;
  @ApiPropertyOptional() @Column({ name: 'epilepsia_controlada', type: 'boolean', nullable: true }) epilepsiaControlada!: boolean | null;
  @ApiPropertyOptional() @Column({ name: 'epilepsia_tratamiento', type: 'text', nullable: true }) epilepsiaTratamiento!: string | null;

  // ACV
  @ApiPropertyOptional() @Column({ name: 'accidente_cerebrovascular', default: false }) accidenteCerebrovascular!: boolean;
  @ApiPropertyOptional() @Column({ name: 'accidente_cerebrovascular_fecha', type: 'date', nullable: true }) acvFecha!: Date | null;
  @ApiPropertyOptional({ enum: AcvTipo }) @Column({ name: 'accidente_cerebrovascular_tipo', type: 'varchar', nullable: true }) acvTipo!: AcvTipo | null;
  @ApiPropertyOptional() @Column({ name: 'accidente_cerebrovascular_secuelas', type: 'text', nullable: true }) acvSecuelas!: string | null;

  // Salud mental
  @ApiPropertyOptional() @Column({ default: false }) depresion!: boolean;
  @ApiPropertyOptional() @Column({ name: 'depresion_tratamiento', type: 'text', nullable: true }) depresionTratamiento!: string | null;
  @ApiPropertyOptional() @Column({ default: false }) ansiedad!: boolean;
  @ApiPropertyOptional() @Column({ name: 'ansiedad_tratamiento', type: 'text', nullable: true }) ansiedadTratamiento!: string | null;
  @ApiPropertyOptional({ type: 'array' }) @Column({ name: 'otros_psiquiatricos', type: 'jsonb', nullable: true }) otrosPsiquiatricos!: object[] | null;

  // JSONB compuestos
  @ApiPropertyOptional({ type: 'array', description: '[{tipo, fecha, hospital, complicaciones}]' }) @Column({ type: 'jsonb', nullable: true }) cirugias!: object[] | null;
  @ApiPropertyOptional({ type: 'array', description: '[{fecha, motivo, hospital, duracion_dias}]' }) @Column({ type: 'jsonb', nullable: true }) hospitalizaciones!: object[] | null;
  @ApiPropertyOptional({ type: 'array', description: '[{zona, fecha, tipo, secuelas}]' }) @Column({ type: 'jsonb', nullable: true }) traumatismos!: object[] | null;
  @ApiPropertyOptional({ type: 'array', description: '[{medicamento, reaccion, severidad}]' }) @Column({ name: 'alergias_medicamentos', type: 'jsonb', nullable: true }) alergiasMedicamentos!: object[] | null;
  @ApiPropertyOptional({ type: 'array' }) @Column({ name: 'alergias_alimentos', type: 'jsonb', nullable: true }) alergiasAlimentos!: object[] | null;
  @ApiPropertyOptional({ type: 'array' }) @Column({ name: 'alergias_otras', type: 'jsonb', nullable: true }) alergiasOtras!: object[] | null;

  @ApiPropertyOptional() @Column({ default: false }) transfusiones!: boolean;
  @ApiPropertyOptional({ type: 'array' }) @Column({ name: 'transfusiones_detalle', type: 'jsonb', nullable: true }) transfusionesDetalle!: object[] | null;
  @ApiPropertyOptional({ type: 'array' }) @Column({ type: 'jsonb', nullable: true }) otros!: object[] | null;

  @Column({ name: 'registrado_por', type: 'uuid', nullable: true }) registradoPorId!: string | null;
  @CreateDateColumn({ name: 'fecha_registro' }) fechaRegistro!: Date;
  @UpdateDateColumn({ name: 'ultima_actualizacion' }) ultimaActualizacion!: Date;
}
