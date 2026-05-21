export enum Genero {
  MASCULINO = 'masculino',
  FEMENINO = 'femenino',
  OTRO = 'otro',
}

export enum EstadoCivil {
  SOLTERO = 'soltero',
  CASADO = 'casado',
  DIVORCIADO = 'divorciado',
  VIUDO = 'viudo',
  UNION_LIBRE = 'union_libre',
}

export interface Patient {
  id: string;
  userId: string | null;
  cedula: string;
  nombres: string;
  apellidos: string;
  email: string | null;
  fechaNacimiento: string;
  genero: Genero;
  telefono: string | null;
  telefonoEmergencia: string | null;
  direccion: string | null;
  ciudad: string | null;
  provincia: string | null;
  codigoPostal: string | null;
  ocupacion: string | null;
  estadoCivil: EstadoCivil | null;
  createdAt: string;
  updatedAt: string;
}

export type CreatePatientData = {
  cedula: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  genero: Genero;
  email?: string;
  telefono?: string;
  telefonoEmergencia?: string;
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  codigoPostal?: string;
  ocupacion?: string;
  estadoCivil?: EstadoCivil;
};

export type UpdatePatientData = Partial<CreatePatientData>;

// ─── Antecedentes ─────────────────────────────────────────────────────────────

export interface AntecedentesHeredofamiliar {
  id: string;
  patientId: string;
  diabetes: boolean;
  diabetesFamiliar: string | null;
  diabetesNotas: string | null;
  hipertension: boolean;
  hipertensionFamiliar: string | null;
  hipertensionNotas: string | null;
  cardiopatias: boolean;
  cardiopatiasFamiliar: string | null;
  cardiopatiasNotas: string | null;
  cancer: boolean;
  cancerTipo: string | null;
  cancerFamiliar: string | null;
  cancerNotas: string | null;
  enfermedadesRespiratorias: boolean;
  enfermedadesRespiratoriasTipo: string | null;
  enfermedadesRespiratoriasFamiliar: string | null;
  enfermedadesRenales: boolean;
  enfermedadesRenalesFamiliar: string | null;
  enfermedadesRenalesNotas: string | null;
  enfermedadesNeurologicas: boolean;
  enfermedadesNeurologicasTipo: string | null;
  enfermedadesNeurologicasFamiliar: string | null;
  enfermedadesMentales: boolean;
  enfermedadesMentalesTipo: string | null;
  enfermedadesMentalesFamiliar: string | null;
  otros: Array<{ enfermedad: string; familiar?: string; notas?: string }> | null;
  registradoPorId: string | null;
  fechaRegistro: string;
  ultimaActualizacion: string;
}

export interface AntecedentesPatologico {
  id: string;
  patientId: string;
  diabetesMellitus: boolean;
  diabetesTipo: string | null;
  diabetesAnioDiagnostico: number | null;
  diabetesTratamiento: string | null;
  hipertensionArterial: boolean;
  hipertensionAnioDiagnostico: number | null;
  hipertensionTratamiento: string | null;
  cardiopatias: boolean;
  cardiopatiasTipo: string | null;
  enfermedadesRespiratorias: boolean;
  enfermedadesRespiratoriasTipo: string | null;
  enfermedadesRenales: boolean;
  enfermedadesRenalesTipo: string | null;
  cancer: boolean;
  cancerTipo: string | null;
  cancerRemision: boolean | null;
  tuberculosis: boolean;
  hepatitis: boolean;
  hepatitisTipo: string | null;
  vihSida: boolean;
  covid19: boolean;
  covid19Severidad: string | null;
  covid19Secuelas: string | null;
  epilepsia: boolean;
  epilepsiaControlada: boolean | null;
  accidenteCerebrovascular: boolean;
  depresion: boolean;
  ansiedad: boolean;
  cirugias: object[] | null;
  hospitalizaciones: object[] | null;
  traumatismos: object[] | null;
  alergiasMedicamentos: object[] | null;
  transfusiones: boolean;
  otros: object[] | null;
  registradoPorId: string | null;
  fechaRegistro: string;
  ultimaActualizacion: string;
}

export interface AntecedentesNoPatologico {
  id: string;
  patientId: string;
  tabaquismo: boolean;
  tabaquismoTipo: string | null;
  tabaquismoCigarrillosDia: number | null;
  alcoholismo: boolean;
  alcoholismoFrecuencia: string | null;
  alcoholismoCantidad: string | null;
  drogas: boolean;
  drogasTipo: string | null;
  cafe: boolean;
  cafeTazasDia: number | null;
  actividadFisica: boolean;
  actividadFisicaTipo: string | null;
  actividadFisicaFrecuencia: string | null;
  actividadFisicaDuracionMinutos: number | null;
  alimentacionTipo: string | null;
  alimentacionComidasDia: number;
  horasSuenoPromedio: number | null;
  calidadSueno: string | null;
  esquemaVacunacionCompleto: boolean | null;
  otrosHabitos: string | null;
  registradoPorId: string | null;
  fechaRegistro: string;
  ultimaActualizacion: string;
}

export interface AntecedentesGineco {
  id: string;
  patientId: string;
  menarcaEdad: number | null;
  fechaUltimaMenstruacion: string | null;
  cicloMenstrualRegular: boolean | null;
  cicloMenstrualDuracionDias: number;
  dismenorrea: boolean;
  dismenorreaIntensidad: string | null;
  menopausia: boolean;
  menopausiaEdad: number | null;
  metodoAnticonceptivoActual: string | null;
  gestas: number;
  partos: number;
  cesareas: number;
  abortos: number;
  hijosVivos: number;
  embarazoActual: boolean;
  embarazoActualSemanas: number | null;
  citologiaUltimaFecha: string | null;
  citologiaResultado: string | null;
  mamografiaUltimaFecha: string | null;
  otros: string | null;
  registradoPorId: string | null;
  fechaRegistro: string;
  ultimaActualizacion: string;
}

export interface AntecedentesCompletos {
  heredofamiliares: AntecedentesHeredofamiliar | null;
  patologicos: AntecedentesPatologico | null;
  noPatologicos: AntecedentesNoPatologico | null;
  ginecoObstetricos: AntecedentesGineco | null;
}

// ─── Tarjetero Índice ──────────────────────────────────────────────────────────

export enum EstadoTarjetero {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
  ARCHIVADO = 'archivado',
}

export interface PatientResumen {
  id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  genero: Genero;
}

export interface TarjeteroIndice {
  id: string;
  codigoHc: string;
  pacienteId: string;
  paciente: PatientResumen;
  medicoResponsableId: string | null;
  estado: EstadoTarjetero;
  observaciones: string | null;
  fechaApertura: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateTarjeteroDto = {
  medicoResponsableId?: string;
  observaciones?: string;
};

export type UpdateTarjeteroDto = {
  medicoResponsableId?: string;
  estado?: EstadoTarjetero;
  observaciones?: string;
};

// ─── Current DB User ──────────────────────────────────────────────────────────

export interface CurrentDbUser {
  id: string;
  email: string;
  role: string;
  cedula: string | null;
  nombres: string | null;
  apellidos: string | null;
  externalAuthId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Clinical Episodes ────────────────────────────────────────────────────────

export enum EstadoEpisodio {
  ABIERTO = 'abierto',
  EN_TRATAMIENTO = 'en_tratamiento',
  CERRADO = 'cerrado',
  ARCHIVADO = 'archivado',
}

export interface ClinicalEpisode {
  id: string;
  tarjeteroId: string;
  codigoHc: string;
  pacienteId: string;
  paciente?: PatientResumen;
  profesionalId: string;
  estado: EstadoEpisodio;
  motivoConsulta: string;
  diagnosticoPrincipal: string | null;
  codigoCie10: string | null;
  diagnosticoSecundario: string | null;
  notaApertura: string | null;
  notaCierre: string | null;
  fechaApertura: string;
  fechaCierre: string | null;
  appointmentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateEpisodioDto = {
  motivoConsulta: string;
  profesionalId: string;
  notaApertura?: string;
};

export type UpdateEpisodioDto = {
  motivoConsulta?: string;
  diagnosticoPrincipal?: string;
  codigoCie10?: string;
  diagnosticoSecundario?: string;
  notaApertura?: string;
  estado?: EstadoEpisodio;
};

export type CloseEpisodioDto = {
  notaCierre: string;
  diagnosticoPrincipal?: string;
  codigoCie10?: string;
};

// ─── SOAP Notes ───────────────────────────────────────────────────────────────

export interface SignosVitales {
  ta: string | null;
  fc: number | null;
  fr: number | null;
  temperatura: number | null;
  spo2: number | null;
  peso: number | null;
  talla: number | null;
}

export interface SoapSubjetivo {
  motivoSesion: string;
  evaDolor: number | null;
  sintomasReferidos: string | null;
}

export interface SoapObjetivo {
  signosVitales: SignosVitales | null;
  hallazgosExamenFisico: string | null;
  rangoMovimiento: string | null;
  fuerzaMuscular: string | null;
  otrosHallazgos: string | null;
}

export interface SoapAnalisis {
  diagnosticoFisioterapeutico: string | null;
  progresoVsAnterior: string | null;
  respuestaTratamiento: string | null;
}

export interface SoapPlan {
  tecnicasAplicadas: string | null;
  ejerciciosIndicados: string | null;
  objetivosProximaSesion: string | null;
  fechaProximaSesion: string | null;
}

export interface SoapNote {
  id: string;
  episodeId: string;
  codigoHc: string;
  pacienteId: string;
  profesionalId: string;
  numeroSesion: number;
  fechaSesion: string;
  subjetivo: SoapSubjetivo;
  objetivo: SoapObjetivo;
  analisis: SoapAnalisis;
  plan: SoapPlan;
  observaciones: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateSoapNoteDto = {
  fechaSesion: string;
  profesionalId: string;
  subjetivo: {
    motivoSesion: string;
    evaDolor?: number;
    sintomasReferidos?: string;
  };
  objetivo: {
    signosVitales?: Partial<SignosVitales>;
    hallazgosExamenFisico?: string;
    rangoMovimiento?: string;
    fuerzaMuscular?: string;
    otrosHallazgos?: string;
  };
  analisis?: {
    diagnosticoFisioterapeutico?: string;
    progresoVsAnterior?: string;
    respuestaTratamiento?: string;
  };
  plan?: {
    tecnicasAplicadas?: string;
    ejerciciosIndicados?: string;
    objetivosProximaSesion?: string;
    fechaProximaSesion?: string;
  };
  observaciones?: string;
};

export type UpdateSoapNoteDto = Partial<CreateSoapNoteDto>;

// ─── Physical Evaluations ─────────────────────────────────────────────────────

export interface PruebaEspecifica {
  resultado: 'positivo' | 'negativo' | 'dudoso';
  notas?: string;
}

export interface PhysicalEvaluation {
  id: string;
  episodeId: string;
  codigoHc: string;
  pacienteId: string;
  profesionalId: string;
  numeroEvaluacion: number;
  fechaEvaluacion: string;
  rangoMovimiento: Record<string, number> | null;
  fuerzaMuscular: Record<string, number> | null;
  escalaDolor: number | null;
  pruebasEspecificas: Record<string, PruebaEspecifica> | null;
  inspeccion: string | null;
  palpacion: string | null;
  diagnostico: string | null;
  observaciones: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateEvaluacionDto = {
  fechaEvaluacion: string;
  profesionalId: string;
  escalaDolor?: number;
  rangoMovimiento?: Record<string, number>;
  fuerzaMuscular?: Record<string, number>;
  pruebasEspecificas?: Record<string, PruebaEspecifica>;
  inspeccion?: string;
  palpacion?: string;
  diagnostico?: string;
  observaciones?: string;
};

export type UpdateEvaluacionDto = Partial<Omit<CreateEvaluacionDto, 'profesionalId'>>;

// ─── Treatment Plans ──────────────────────────────────────────────────────────

export enum EstadoPlan {
  ACTIVO = 'activo',
  COMPLETADO = 'completado',
  CANCELADO = 'cancelado',
}

export interface Exercise {
  id: string;
  planId: string;
  nombre: string;
  descripcion: string | null;
  series: number | null;
  repeticiones: number | null;
  duracionSegundos: number | null;
  orden: number;
  observaciones: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TreatmentPlan {
  id: string;
  episodeId: string;
  codigoHc: string;
  pacienteId: string;
  profesionalId: string;
  numeroPlan: number;
  estado: EstadoPlan;
  objetivoTerapeutico: string;
  duracionEstimadaSemanas: number | null;
  frecuenciaSemanal: number | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  progresoPorcentaje: number;
  appointmentId: string | null;
  observaciones: string | null;
  exercises: Exercise[];
  createdAt: string;
  updatedAt: string;
}

export type CreatePlanDto = {
  profesionalId: string;
  objetivoTerapeutico: string;
  duracionEstimadaSemanas?: number;
  frecuenciaSemanal?: number;
  fechaInicio?: string;
  fechaFin?: string;
  appointmentId?: string;
  observaciones?: string;
};

export type UpdatePlanDto = {
  objetivoTerapeutico?: string;
  duracionEstimadaSemanas?: number;
  frecuenciaSemanal?: number;
  fechaInicio?: string;
  fechaFin?: string;
  appointmentId?: string;
  progresoPorcentaje?: number;
  estado?: EstadoPlan.COMPLETADO | EstadoPlan.CANCELADO;
  observaciones?: string;
};

export type CreateExerciseDto = {
  nombre: string;
  descripcion?: string;
  series?: number;
  repeticiones?: number;
  duracionSegundos?: number;
  observaciones?: string;
};

export type UpdateExerciseDto = Partial<CreateExerciseDto>;

export type ReorderExercisesDto = {
  orden: Array<{ id: string; orden: number }>;
};

// ─── Appointments ─────────────────────────────────────────────────────────────

export enum TipoCita {
  PRIMERA_VEZ = 'PRIMERA_VEZ',
  SEGUIMIENTO = 'SEGUIMIENTO',
  INTERCONSULTA = 'INTERCONSULTA',
}

export enum EstadoCita {
  CONFIRMADA = 'CONFIRMADA',
  CANCELADA = 'CANCELADA',
  COMPLETADA = 'COMPLETADA',
  REPROGRAMADA = 'REPROGRAMADA',
  NO_ASISTIO = 'NO_ASISTIO',
}

export interface Appointment {
  id: string;
  patientId: string;
  patient: PatientResumen;
  professionalId: string;
  scheduledAt: string;
  durationMinutes: number;
  tipoCita: TipoCita;
  estado: EstadoCita;
  motivo: string | null;
  notas: string | null;
  motivoCancelacion: string | null;
  episodeId: string | null;
  sessionPaymentId: string | null;
  reprogramadaDeId: string | null;
  nuevaCitaId: string | null;
  motivoReprogramacion: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EnrichedAppointment extends Appointment {
  episode: { codigoHc: string; motivoConsulta: string; estado: string } | null;
  session: { id: string; numeroSesion: number; estado: string; plan: { nombre: string } | null } | null;
  payment: { monto: number; estadoPago: string } | null;
  reprogramadaDe: { id: string; scheduledAt: string } | null;
  nuevaCita: { id: string; scheduledAt: string; estado: EstadoCita } | null;
}

export type CreateAppointmentDto = {
  patientId: string;
  professionalId: string;
  scheduledAt: string;
  tipoCita: TipoCita;
  durationMinutes?: number;
  motivo?: string;
  notas?: string;
};

export type UpdateAppointmentDto = {
  scheduledAt?: string;
  durationMinutes?: number;
  professionalId?: string;
  motivo?: string;
  notas?: string;
};

export type CancelAppointmentDto = {
  motivoCancelacion: string;
};

export type CompleteAppointmentDto = {
  monto: number;
  episodeId?: string;
  planId?: string;
};

export type CompleteAppointmentResponse = {
  appointment: Appointment;
  sessionId: string | null;
};

export type RescheduleAppointmentDto = {
  scheduledAt: string;
  motivo?: string;
};

export type RescheduleAppointmentResponse = {
  original: Appointment;
  nueva: Appointment;
};

// ─── Sessions ─────────────────────────────────────────────────────────────────

export enum TipoSesion {
  FISIOTERAPIA = 'FISIOTERAPIA',
  EVALUACION_FISICA = 'EVALUACION_FISICA',
  INTERCONSULTA = 'INTERCONSULTA',
  CONSULTA_MEDICA = 'CONSULTA_MEDICA',
}

export enum EstadoSesion {
  PROGRAMADA = 'PROGRAMADA',
  EN_CURSO = 'EN_CURSO',
  COMPLETADA = 'COMPLETADA',
  CANCELADA = 'CANCELADA',
}

export interface Session {
  id: string;
  planId: string | null;
  episodeId: string;
  codigoHc: string;
  pacienteId: string;
  profesionalId: string;
  tipo: TipoSesion;
  estado: EstadoSesion;
  numeroSesion: number;
  fechaSesion: string;
  appointmentId: string | null;
  soapNote: SoapNote | null;
  physicalEval: PhysicalEvaluation | null;
  interconsult: any | null;
  observaciones: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateSessionDto = {
  tipo: TipoSesion;
  fechaSesion: string;
  profesionalId: string;
  appointmentId?: string;
  observaciones?: string;
};

export type UpdateSessionDto = {
  fechaSesion?: string;
  profesionalId?: string;
  estado?: EstadoSesion;
  observaciones?: string;
};

export interface SessionListResponse {
  data: Session[];
  meta: { total: number; page: number; limit: number; pages: number };
}
