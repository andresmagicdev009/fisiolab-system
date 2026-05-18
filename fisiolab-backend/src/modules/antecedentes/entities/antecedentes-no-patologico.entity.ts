import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TabaquismoTipo { FUMADOR_ACTIVO = 'FUMADOR_ACTIVO', EX_FUMADOR = 'EX_FUMADOR', NUNCA = 'NUNCA' }
export enum AlcoholismoFrecuencia { DIARIO = 'DIARIO', SEMANAL = 'SEMANAL', MENSUAL = 'MENSUAL', OCASIONAL = 'OCASIONAL', NUNCA = 'NUNCA' }
export enum ActividadFisicaFrecuencia { DIARIA = 'DIARIA', SEMANAL = 'SEMANAL', MENSUAL = 'MENSUAL', RARA_VEZ = 'RARA_VEZ', NUNCA = 'NUNCA' }
export enum ActividadFisicaIntensidad { LEVE = 'LEVE', MODERADA = 'MODERADA', VIGOROSA = 'VIGOROSA' }
export enum AlimentacionTipo { OMNIVORA = 'OMNIVORA', VEGETARIANA = 'VEGETARIANA', VEGANA = 'VEGANA', OTRA = 'OTRA' }
export enum CalidadSueno { EXCELENTE = 'EXCELENTE', BUENA = 'BUENA', REGULAR = 'REGULAR', MALA = 'MALA' }
export enum TipoVivienda { PROPIA = 'PROPIA', ALQUILADA = 'ALQUILADA', FAMILIAR = 'FAMILIAR', OTRA = 'OTRA' }

export interface ServiciosBasicos {
  agua: boolean;
  luz: boolean;
  alcantarillado: boolean;
  internet: boolean;
}

@Entity('antecedentes_personales_no_patologicos')
@Index('idx_no_patologicos_patient', ['patientId'])
export class AntecedentesNoPatologico {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'patient_id', type: 'uuid' }) patientId!: string;

  // Tabaquismo
  @ApiPropertyOptional() @Column({ default: false }) tabaquismo!: boolean;
  @ApiPropertyOptional({ enum: TabaquismoTipo }) @Column({ name: 'tabaquismo_tipo', type: 'varchar', nullable: true }) tabaquismoTipo!: TabaquismoTipo | null;
  @ApiPropertyOptional() @Column({ name: 'tabaquismo_cigarrillos_dia', type: 'int', nullable: true }) tabaquismoCigarrillosDia!: number | null;
  @ApiPropertyOptional() @Column({ name: 'tabaquismo_anios_fumando', type: 'int', nullable: true }) tabaquismoAniosFumando!: number | null;
  @ApiPropertyOptional() @Column({ name: 'tabaquismo_anios_sin_fumar', type: 'int', nullable: true }) tabaquismoAniosSinFumar!: number | null;

  // Alcoholismo
  @ApiPropertyOptional() @Column({ default: false }) alcoholismo!: boolean;
  @ApiPropertyOptional({ enum: AlcoholismoFrecuencia }) @Column({ name: 'alcoholismo_frecuencia', type: 'varchar', nullable: true }) alcoholismoFrecuencia!: AlcoholismoFrecuencia | null;
  @ApiPropertyOptional() @Column({ name: 'alcoholismo_cantidad', nullable: true, type: 'varchar', length: 100 }) alcoholismoCantidad!: string | null;
  @ApiPropertyOptional() @Column({ name: 'alcoholismo_tipo', nullable: true, type: 'varchar', length: 100 }) alcoholismoTipo!: string | null;

  // Drogas
  @ApiPropertyOptional() @Column({ default: false }) drogas!: boolean;
  @ApiPropertyOptional() @Column({ name: 'drogas_tipo', nullable: true, type: 'varchar', length: 255 }) drogasTipo!: string | null;
  @ApiPropertyOptional() @Column({ name: 'drogas_frecuencia', nullable: true, type: 'varchar', length: 50 }) drogasFrecuencia!: string | null;
  @ApiPropertyOptional() @Column({ name: 'drogas_anios_consumo', type: 'int', nullable: true }) drogasAniosConsumo!: number | null;

  // Café
  @ApiPropertyOptional() @Column({ default: false }) cafe!: boolean;
  @ApiPropertyOptional() @Column({ name: 'cafe_tazas_dia', type: 'int', nullable: true }) cafeTazasDia!: number | null;

  // Actividad Física
  @ApiPropertyOptional() @Column({ name: 'actividad_fisica', default: false }) actividadFisica!: boolean;
  @ApiPropertyOptional() @Column({ name: 'actividad_fisica_tipo', nullable: true, type: 'varchar', length: 255 }) actividadFisicaTipo!: string | null;
  @ApiPropertyOptional({ enum: ActividadFisicaFrecuencia }) @Column({ name: 'actividad_fisica_frecuencia', type: 'varchar', nullable: true }) actividadFisicaFrecuencia!: ActividadFisicaFrecuencia | null;
  @ApiPropertyOptional() @Column({ name: 'actividad_fisica_duracion_minutos', type: 'int', nullable: true }) actividadFisicaDuracionMinutos!: number | null;
  @ApiPropertyOptional({ enum: ActividadFisicaIntensidad }) @Column({ name: 'actividad_fisica_intensidad', type: 'varchar', nullable: true }) actividadFisicaIntensidad!: ActividadFisicaIntensidad | null;

  // Alimentación
  @ApiPropertyOptional({ enum: AlimentacionTipo }) @Column({ name: 'alimentacion_tipo', type: 'varchar', nullable: true }) alimentacionTipo!: AlimentacionTipo | null;
  @ApiPropertyOptional() @Column({ name: 'alimentacion_comidas_dia', type: 'int', default: 3 }) alimentacionComidasDia!: number;
  @ApiPropertyOptional() @Column({ name: 'alimentacion_hidratacion_litros', type: 'decimal', precision: 3, scale: 1, nullable: true }) alimentacionHidratacionLitros!: number | null;
  @ApiPropertyOptional() @Column({ name: 'alimentacion_notas', type: 'text', nullable: true }) alimentacionNotas!: string | null;

  // Sueño
  @ApiPropertyOptional() @Column({ name: 'horas_sueno_promedio', type: 'decimal', precision: 3, scale: 1, nullable: true }) horasSuenoPromedio!: number | null;
  @ApiPropertyOptional({ enum: CalidadSueno }) @Column({ name: 'calidad_sueno', type: 'varchar', nullable: true }) calidadSueno!: CalidadSueno | null;
  @ApiPropertyOptional() @Column({ name: 'trastornos_sueno', default: false }) trastornosSueno!: boolean;
  @ApiPropertyOptional() @Column({ name: 'trastornos_sueno_tipo', nullable: true, type: 'varchar', length: 255 }) trastornosSuenoTipo!: string | null;

  // Vivienda
  @ApiPropertyOptional({ enum: TipoVivienda }) @Column({ name: 'tipo_vivienda', type: 'varchar', nullable: true }) tipoVivienda!: TipoVivienda | null;
  @ApiPropertyOptional() @Column({ name: 'servicios_basicos', type: 'jsonb', nullable: true }) serviciosBasicos!: ServiciosBasicos | null;
  @ApiPropertyOptional() @Column({ default: false }) hacinamiento!: boolean;
  @ApiPropertyOptional() @Column({ name: 'numero_personas_hogar', type: 'int', nullable: true }) numeroPersonasHogar!: number | null;

  // Animales
  @ApiPropertyOptional() @Column({ name: 'animales_domesticos', default: false }) animalesDomesticos!: boolean;
  @ApiPropertyOptional() @Column({ name: 'animales_tipo', nullable: true, type: 'varchar', length: 255 }) animalesTipo!: string | null;

  // Exposición laboral
  @ApiPropertyOptional() @Column({ name: 'exposicion_quimicos', default: false }) exposicionQuimicos!: boolean;
  @ApiPropertyOptional() @Column({ name: 'exposicion_quimicos_tipo', type: 'text', nullable: true }) exposicionQuimicosTipo!: string | null;
  @ApiPropertyOptional() @Column({ name: 'exposicion_radiacion', default: false }) exposicionRadiacion!: boolean;
  @ApiPropertyOptional() @Column({ name: 'exposicion_radiacion_tipo', type: 'text', nullable: true }) exposicionRadiacionTipo!: string | null;
  @ApiPropertyOptional() @Column({ name: 'exposicion_ruido', default: false }) exposicionRuido!: boolean;
  @ApiPropertyOptional() @Column({ name: 'trabajo_forzado', default: false }) trabajoForzado!: boolean;
  @ApiPropertyOptional() @Column({ name: 'trabajo_turnos_rotativos', default: false }) trabajoTurnosRotativos!: boolean;

  // JSONB
  @ApiPropertyOptional({ type: 'array', description: '[{pais, fecha, motivo}]' }) @Column({ name: 'viajes_recientes', type: 'jsonb', nullable: true }) viajesRecientes!: object[] | null;
  @ApiPropertyOptional() @Column({ name: 'esquema_vacunacion_completo', type: 'boolean', nullable: true }) esquemaVacunacionCompleto!: boolean | null;
  @ApiPropertyOptional({ type: 'array', description: '[{nombre, dosis_total, ultima_dosis_fecha}]' }) @Column({ type: 'jsonb', nullable: true }) vacunas!: object[] | null;
  @ApiPropertyOptional() @Column({ name: 'otros_habitos', type: 'text', nullable: true }) otrosHabitos!: string | null;

  @Column({ name: 'registrado_por', type: 'uuid', nullable: true }) registradoPorId!: string | null;
  @CreateDateColumn({ name: 'fecha_registro' }) fechaRegistro!: Date;
  @UpdateDateColumn({ name: 'ultima_actualizacion' }) ultimaActualizacion!: Date;
}
