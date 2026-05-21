import { AppointmentStateStrategy } from '../interfaces/appointment-state.strategy';
import { EstadoCita } from '../entities/appointment.entity';

export class ConfirmadaState extends AppointmentStateStrategy {
  readonly estadoCita = EstadoCita.CONFIRMADA;

  assertCanCancel(): void {}
  assertCanComplete(): void {}
  assertCanReschedule(): void {}
  assertCanNoShow(): void {}
  assertCanPatch(): void {}
}
