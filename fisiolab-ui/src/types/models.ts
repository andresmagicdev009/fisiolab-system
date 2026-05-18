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
