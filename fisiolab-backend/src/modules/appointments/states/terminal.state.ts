import { UnprocessableEntityException } from '@nestjs/common';
import { AppointmentStateStrategy } from '../interfaces/appointment-state.strategy';
import { EstadoCita } from '../entities/appointment.entity';

export class TerminalState extends AppointmentStateStrategy {
  readonly estadoCita: EstadoCita;

  constructor(estado: EstadoCita) {
    super();
    this.estadoCita = estado;
  }

  assertCanCancel(): void { this.fail(); }
  assertCanComplete(): void { this.fail(); }
  assertCanReschedule(): void { this.fail(); }
  assertCanNoShow(): void { this.fail(); }
  assertCanPatch(): void { this.fail(); }

  private fail(): never {
    throw new UnprocessableEntityException(`Cita ${this.estadoCita} — inmutable`);
  }
}
