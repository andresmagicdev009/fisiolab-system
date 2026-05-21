export interface SignosVitales {
  ta?: string;
  fc?: number;
  fr?: number;
  temperatura?: number;
  spo2?: number;
  peso?: number;
  talla?: number;
}

export interface SoapS {
  motivoSesion: string;
  evaDolor?: number | null;
  sintomasReferidos?: string | null;
}

export interface SoapO {
  signosVitales?: SignosVitales | null;
  hallazgosExamenFisico?: string | null;
  rangoMovimiento?: string | null;
  fuerzaMuscular?: string | null;
  otrosHallazgos?: string | null;
}

export interface SoapA {
  diagnosticoFisioterapeutico?: string | null;
  progresoVsAnterior?: string | null;
  respuestaTratamiento?: string | null;
}

export interface SoapP {
  tecnicasAplicadas?: string | null;
  ejerciciosIndicados?: string | null;
  objetivosProximaSesion?: string | null;
  fechaProximaSesion?: string | null;
}
