import { Appointment } from '../entities/appointment.entity';

export interface EnrichedAppointment extends Appointment {
  episode: {
    codigoHc: string;
    motivoConsulta: string;
    estado: string;
  } | null;

  session: {
    id: string;
    numeroSesion: number;
    estado: string;
    plan: { objetivoTerapeutico: string } | null;
  } | null;

  payment: {
    monto: number;
    estadoPago: string;
  } | null;

  reprogramadaDe: {
    id: string;
    scheduledAt: Date;
  } | null;

  nuevaCita: {
    id: string;
    scheduledAt: Date;
    estado: string;
  } | null;
}
