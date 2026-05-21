import { UnprocessableEntityException } from '@nestjs/common';
import { PaymentStateStrategy } from '../interfaces/payment-state.strategy';
import { EstadoPago } from '../entities/session-payment.entity';
import { PendienteState } from '../states/pendiente.state';
import { ParcialState } from '../states/parcial.state';
import { PagadoState } from '../states/pagado.state';

export class PaymentStateFactory {
  private static readonly registry = new Map<EstadoPago, PaymentStateStrategy>([
    [EstadoPago.PENDIENTE, new PendienteState()],
    [EstadoPago.PARCIAL, new ParcialState()],
    [EstadoPago.PAGADO, new PagadoState()],
  ]);

  static get(estadoPago: EstadoPago): PaymentStateStrategy {
    const state = PaymentStateFactory.registry.get(estadoPago);
    if (!state) {
      throw new UnprocessableEntityException(`Estado de pago desconocido: ${estadoPago}`);
    }
    return state;
  }
}
