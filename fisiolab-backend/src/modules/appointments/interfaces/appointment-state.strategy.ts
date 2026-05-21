import { EstadoCita } from '../entities/appointment.entity';

export abstract class AppointmentStateStrategy {
  abstract readonly estadoCita: EstadoCita;

  abstract assertCanCancel(): void;
  abstract assertCanComplete(): void;
  abstract assertCanReschedule(): void;
  abstract assertCanNoShow(): void;
  abstract assertCanPatch(): void;
}
