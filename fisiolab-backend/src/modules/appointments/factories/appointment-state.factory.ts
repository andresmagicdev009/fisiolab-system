import { UnprocessableEntityException } from '@nestjs/common';
import { AppointmentStateStrategy } from '../interfaces/appointment-state.strategy';
import { EstadoCita } from '../entities/appointment.entity';
import { ConfirmadaState } from '../states/confirmada.state';
import { TerminalState } from '../states/terminal.state';

export class AppointmentStateFactory {
  private static readonly registry = new Map<EstadoCita, AppointmentStateStrategy>([
    [EstadoCita.CONFIRMADA,   new ConfirmadaState()],
    [EstadoCita.CANCELADA,    new TerminalState(EstadoCita.CANCELADA)],
    [EstadoCita.COMPLETADA,   new TerminalState(EstadoCita.COMPLETADA)],
    [EstadoCita.REPROGRAMADA, new TerminalState(EstadoCita.REPROGRAMADA)],
    [EstadoCita.NO_ASISTIO,   new TerminalState(EstadoCita.NO_ASISTIO)],
  ]);

  static get(estado: EstadoCita): AppointmentStateStrategy {
    const state = AppointmentStateFactory.registry.get(estado);
    if (!state) throw new UnprocessableEntityException(`Estado de cita desconocido: ${estado}`);
    return state;
  }
}
