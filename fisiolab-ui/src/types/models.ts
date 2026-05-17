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
