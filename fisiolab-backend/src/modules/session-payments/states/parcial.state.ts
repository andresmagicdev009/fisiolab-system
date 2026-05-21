import { UnprocessableEntityException } from '@nestjs/common';
import { PaymentStateStrategy } from '../interfaces/payment-state.strategy';
import { EstadoPago, SessionPayment } from '../entities/session-payment.entity';
import { UpdateSessionPaymentDto } from '../dto/update-session-payment.dto';

export class ParcialState extends PaymentStateStrategy {
  readonly estadoPago = EstadoPago.PARCIAL;

  pay(payment: SessionPayment, dto: UpdateSessionPaymentDto): SessionPayment {
    const destino = dto.estadoPago;

    if (!destino || destino !== EstadoPago.PAGADO) {
      throw new UnprocessableEntityException(
        'Pago parcial solo puede completarse con estadoPago: PAGADO',
      );
    }

    if (!dto.metodoPago) {
      throw new UnprocessableEntityException('metodoPago es requerido para completar el pago');
    }

    if (dto.monto !== undefined) {
      payment.monto = dto.monto;
    }

    payment.estadoPago = EstadoPago.PAGADO;
    payment.metodoPago = dto.metodoPago;
    payment.fechaPago = dto.fechaPago ? new Date(dto.fechaPago) : new Date();
    return payment;
  }
}
