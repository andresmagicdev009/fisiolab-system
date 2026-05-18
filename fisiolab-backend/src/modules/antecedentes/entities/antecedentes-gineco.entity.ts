import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum MenstruacionCantidad { ESCASA = 'ESCASA', MODERADA = 'MODERADA', ABUNDANTE = 'ABUNDANTE' }
export enum DismenorreaIntensidad { LEVE = 'LEVE', MODERADA = 'MODERADA', SEVERA = 'SEVERA' }
export enum CitologiaResultado { NORMAL = 'NORMAL', ANORMAL = 'ANORMAL', PENDIENTE = 'PENDIENTE' }

@Entity('antecedentes_gineco_obstetricos')
@Index('idx_gineco_obstetricos_patient', ['patientId'])
export class AntecedentesGineco {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ name: 'patient_id', type: 'uuid' }) patientId!: string;

  // Menstruación
  @ApiPropertyOptional() @Column({ name: 'menarca_edad', type: 'int', nullable: true }) menarcaEdad!: number | null;
  @ApiPropertyOptional() @Column({ name: 'fecha_ultima_menstruacion', type: 'date', nullable: true }) fechaUltimaMenstruacion!: Date | null;
  @ApiPropertyOptional() @Column({ name: 'ciclo_menstrual_regular', type: 'boolean', nullable: true }) cicloMenstrualRegular!: boolean | null;
  @ApiPropertyOptional() @Column({ name: 'ciclo_menstrual_duracion_dias', type: 'int', default: 28 }) cicloMenstrualDuracionDias!: number;
  @ApiPropertyOptional() @Column({ name: 'ciclo_menstrual_notas', type: 'text', nullable: true }) cicloMenstrualNotas!: string | null;
  @ApiPropertyOptional() @Column({ name: 'menstruacion_duracion_dias', type: 'int', default: 5 }) menstruacionDuracionDias!: number;
  @ApiPropertyOptional({ enum: MenstruacionCantidad }) @Column({ name: 'menstruacion_cantidad', type: 'varchar', nullable: true }) menstruacionCantidad!: MenstruacionCantidad | null;
  @ApiPropertyOptional() @Column({ default: false }) dismenorrea!: boolean;
  @ApiPropertyOptional({ enum: DismenorreaIntensidad }) @Column({ name: 'dismenorrea_intensidad', type: 'varchar', nullable: true }) dismenorreaIntensidad!: DismenorreaIntensidad | null;

  // Menopausia
  @ApiPropertyOptional() @Column({ default: false }) menopausia!: boolean;
  @ApiPropertyOptional() @Column({ name: 'menopausia_edad', type: 'int', nullable: true }) menopausiaEdad!: number | null;
  @ApiPropertyOptional() @Column({ name: 'menopausia_sintomas', type: 'text', nullable: true }) menopausiaSintomas!: string | null;
  @ApiPropertyOptional() @Column({ name: 'menopausia_terapia_reemplazo', default: false }) menopausiaTerapiaReemplazo!: boolean;

  // Vida Sexual
  @ApiPropertyOptional() @Column({ name: 'inicio_vida_sexual_edad', type: 'int', nullable: true }) inicioVidaSexualEdad!: number | null;
  @ApiPropertyOptional() @Column({ name: 'parejas_sexuales_numero', type: 'int', nullable: true }) parejasSexualesNumero!: number | null;
  @ApiPropertyOptional() @Column({ name: 'metodo_anticonceptivo_actual', nullable: true, type: 'varchar', length: 100 }) metodoAnticonceptivoActual!: string | null;
  @ApiPropertyOptional() @Column({ name: 'metodo_anticonceptivo_tiempo_uso_meses', type: 'int', nullable: true }) metodoAnticonceptivoTiempoUsoMeses!: number | null;
  @ApiPropertyOptional({ type: 'array' }) @Column({ name: 'metodos_anticonceptivos_previos', type: 'jsonb', nullable: true }) metodosAnticonceptivosPrevios!: object[] | null;

  // Citología y Mamografía
  @ApiPropertyOptional() @Column({ name: 'citologia_ultima_fecha', type: 'date', nullable: true }) citologiaUltimaFecha!: Date | null;
  @ApiPropertyOptional({ enum: CitologiaResultado }) @Column({ name: 'citologia_resultado', type: 'varchar', nullable: true }) citologiaResultado!: CitologiaResultado | null;
  @ApiPropertyOptional() @Column({ name: 'citologia_notas', type: 'text', nullable: true }) citologiaNotas!: string | null;
  @ApiPropertyOptional() @Column({ name: 'mamografia_ultima_fecha', type: 'date', nullable: true }) mamografiaUltimaFecha!: Date | null;
  @ApiPropertyOptional({ enum: CitologiaResultado }) @Column({ name: 'mamografia_resultado', type: 'varchar', nullable: true }) mamografiaResultado!: CitologiaResultado | null;
  @ApiPropertyOptional() @Column({ name: 'mamografia_notas', type: 'text', nullable: true }) mamografiaNotas!: string | null;

  // Infecciones y enfermedades ginecológicas
  @ApiPropertyOptional() @Column({ name: 'infecciones_vaginales', default: false }) infeccionesVaginales!: boolean;
  @ApiPropertyOptional() @Column({ name: 'infecciones_vaginales_tipo', nullable: true, type: 'varchar', length: 255 }) infeccionesVaginalesTipo!: string | null;
  @ApiPropertyOptional() @Column({ name: 'infecciones_vaginales_frecuencia', nullable: true, type: 'varchar', length: 50 }) infeccionesVaginalesFrecuencia!: string | null;

  @ApiPropertyOptional() @Column({ name: 'enfermedad_pelvica_inflamatoria', default: false }) enfermedadPelvicaInflamatoria!: boolean;
  @ApiPropertyOptional() @Column({ name: 'enfermedad_pelvica_inflamatoria_fecha', type: 'date', nullable: true }) epiDate!: Date | null;
  @ApiPropertyOptional() @Column({ default: false }) endometriosis!: boolean;
  @ApiPropertyOptional() @Column({ name: 'endometriosis_tratamiento', type: 'text', nullable: true }) endometriosisTratamiento!: string | null;
  @ApiPropertyOptional() @Column({ name: 'miomatosis_uterina', default: false }) miomatosisUterina!: boolean;
  @ApiPropertyOptional() @Column({ name: 'miomatosis_uterina_cantidad', type: 'int', nullable: true }) miomatosisUterinaCantidad!: number | null;
  @ApiPropertyOptional() @Column({ name: 'miomatosis_uterina_tratamiento', type: 'text', nullable: true }) miomatosisUterinaTratamiento!: string | null;
  @ApiPropertyOptional() @Column({ name: 'quistes_ovaricos', default: false }) quistesOvaricos!: boolean;
  @ApiPropertyOptional() @Column({ name: 'quistes_ovaricos_tipo', nullable: true, type: 'varchar', length: 100 }) quistesOvaricosTipo!: string | null;
  @ApiPropertyOptional() @Column({ name: 'quistes_ovaricos_tratamiento', type: 'text', nullable: true }) quistesOvaricosTratamiento!: string | null;
  @ApiPropertyOptional() @Column({ name: 'sindrome_ovario_poliquistico', default: false }) sindromeOvarioPoliquistico!: boolean;

  // JSONB ginecológicos
  @ApiPropertyOptional({ type: 'array' }) @Column({ name: 'its_historial', type: 'jsonb', nullable: true }) itsHistorial!: object[] | null;
  @ApiPropertyOptional({ type: 'array' }) @Column({ name: 'cirugias_ginecologicas', type: 'jsonb', nullable: true }) cirugiasGinecologicas!: object[] | null;

  // Fórmula obstétrica
  @ApiPropertyOptional() @Column({ default: 0 }) gestas!: number;
  @ApiPropertyOptional() @Column({ default: 0 }) partos!: number;
  @ApiPropertyOptional() @Column({ default: 0 }) cesareas!: number;
  @ApiPropertyOptional() @Column({ default: 0 }) abortos!: number;
  @ApiPropertyOptional({ type: 'array' }) @Column({ name: 'abortos_tipo', type: 'jsonb', nullable: true }) abortosTipo!: object[] | null;
  @ApiPropertyOptional() @Column({ name: 'hijos_vivos', default: 0 }) hijosVivos!: number;
  @ApiPropertyOptional() @Column({ name: 'hijos_muertos', default: 0 }) hijosMuertos!: number;
  @ApiPropertyOptional({ type: 'array', description: '[{numero, fecha_parto, tipo_parto, peso_rn, ...}]' }) @Column({ type: 'jsonb', nullable: true }) embarazos!: object[] | null;

  // Embarazo actual
  @ApiPropertyOptional() @Column({ name: 'embarazo_actual', default: false }) embarazoActual!: boolean;
  @ApiPropertyOptional() @Column({ name: 'embarazo_actual_semanas', type: 'int', nullable: true }) embarazoActualSemanas!: number | null;
  @ApiPropertyOptional() @Column({ name: 'embarazo_actual_fecha_probable_parto', type: 'date', nullable: true }) embarazoActualFechaProbableParto!: Date | null;
  @ApiPropertyOptional() @Column({ name: 'embarazo_actual_control_prenatal', type: 'boolean', nullable: true }) embarazoActualControlPrenatal!: boolean | null;
  @ApiPropertyOptional() @Column({ name: 'embarazo_actual_complicaciones', type: 'text', nullable: true }) embarazoActualComplicaciones!: string | null;

  // Complicaciones obstétricas
  @ApiPropertyOptional() @Column({ default: false }) preeclampsia!: boolean;
  @ApiPropertyOptional() @Column({ default: false }) eclampsia!: boolean;
  @ApiPropertyOptional() @Column({ name: 'diabetes_gestacional', default: false }) diabetesGestacional!: boolean;
  @ApiPropertyOptional() @Column({ name: 'hemorragia_postparto', default: false }) hemorragiaPostparto!: boolean;
  @ApiPropertyOptional() @Column({ name: 'ruptura_prematura_membranas', default: false }) rupturaPrematurMembranas!: boolean;
  @ApiPropertyOptional() @Column({ name: 'placenta_previa', default: false }) placentaPrevia!: boolean;

  @ApiPropertyOptional() @Column({ name: 'lactancia_actual', default: false }) lactanciaActual!: boolean;
  @ApiPropertyOptional() @Column({ type: 'text', nullable: true }) otros!: string | null;

  @Column({ name: 'registrado_por', type: 'uuid', nullable: true }) registradoPorId!: string | null;
  @CreateDateColumn({ name: 'fecha_registro' }) fechaRegistro!: Date;
  @UpdateDateColumn({ name: 'ultima_actualizacion' }) ultimaActualizacion!: Date;
}
