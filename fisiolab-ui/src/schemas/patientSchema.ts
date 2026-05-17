import * as yup from 'yup';
import { Genero, EstadoCivil } from 'types/models';

function validarCedulaEcuatoriana(cedula: string): boolean {
  if (!/^\d{10}$/.test(cedula)) return false;

  const provincia = parseInt(cedula.substring(0, 2), 10);
  if (provincia < 1 || provincia > 24) return false;

  const digitos = cedula.split('').map(Number);
  const verificador = digitos[9];
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    let valor = digitos[i];
    if (i % 2 === 0) {
      valor *= 2;
      if (valor > 9) valor -= 9;
    }
    suma += valor;
  }

  const residuo = suma % 10;
  const digitoCalculado = residuo === 0 ? 0 : 10 - residuo;
  return digitoCalculado === verificador;
}

const optionalPhone = yup
  .string()
  .test('phone', 'Debe tener 10 dígitos', (val) => !val || /^\d{10}$/.test(val));

const optionalPostal = yup
  .string()
  .test('postal', 'Debe tener 6 dígitos', (val) => !val || /^\d{6}$/.test(val));

export const patientSchema = yup.object({
  cedula: yup
    .string()
    .required('La cédula es obligatoria')
    .matches(/^\d{10}$/, 'Debe tener exactamente 10 dígitos numéricos')
    .test('cedula-ecuatoriana', 'Cédula ecuatoriana inválida', validarCedulaEcuatoriana),

  nombres: yup
    .string()
    .required('Los nombres son obligatorios')
    .min(2, 'Mínimo 2 caracteres')
    .max(100, 'Máximo 100 caracteres'),

  apellidos: yup
    .string()
    .required('Los apellidos son obligatorios')
    .min(2, 'Mínimo 2 caracteres')
    .max(100, 'Máximo 100 caracteres'),

  fechaNacimiento: yup
    .string()
    .required('La fecha de nacimiento es obligatoria')
    .test('fecha-valida', 'Fecha inválida', (val) => {
      if (!val) return false;
      const d = new Date(val);
      return !isNaN(d.getTime()) && d < new Date();
    }),

  genero: yup
    .mixed<Genero>()
    .oneOf(Object.values(Genero), 'Género inválido')
    .required('El género es obligatorio'),

  email: yup
    .string()
    .test('email', 'Email inválido', (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)),

  telefono: optionalPhone,
  telefonoEmergencia: optionalPhone,

  direccion: yup.string().max(255, 'Máximo 255 caracteres'),
  ciudad: yup.string().max(100, 'Máximo 100 caracteres'),
  provincia: yup.string().max(100, 'Máximo 100 caracteres'),
  codigoPostal: optionalPostal,
  ocupacion: yup.string().max(100, 'Máximo 100 caracteres'),

  estadoCivil: yup
    .mixed<EstadoCivil>()
    .oneOf([...Object.values(EstadoCivil), undefined, '' as any], 'Estado civil inválido'),
});

export interface PatientFormValues {
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
  estadoCivil?: EstadoCivil | '';
}

export const PROVINCIAS_ECUADOR = [
  'Azuay', 'Bolívar', 'Cañar', 'Carchi', 'Chimborazo',
  'Cotopaxi', 'El Oro', 'Esmeraldas', 'Galápagos', 'Guayas',
  'Imbabura', 'Loja', 'Los Ríos', 'Manabí', 'Morona Santiago',
  'Napo', 'Orellana', 'Pastaza', 'Pichincha', 'Santa Elena',
  'Santo Domingo de los Tsáchilas', 'Sucumbíos', 'Tungurahua',
  'Zamora Chinchipe',
];
