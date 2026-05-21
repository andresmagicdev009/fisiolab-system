import { UnprocessableEntityException } from '@nestjs/common';
import { PaymentStateStrategy } from '../interfaces/payment-state.strategy';
import { EstadoPago, SessionPayment } from '../entities/session-payment.entity';
import { UpdateSessionPaymentDto } from '../dto/update-session-payment.dto';

export class PendienteState extends PaymentStateStrategy {
  readonly estadoPago = EstadoPago.PENDIENTE;

  pay(payment: SessionPayment, dto: UpdateSessionPaymentDto): SessionPayment {
    const destino = dto.estadoPago;

    if (!destino || destino === EstadoPago.PENDIENTE) {
      throw new UnprocessableEntityException(
        'Especifique estadoPago: PAGADO (pago completo) o PARCIAL (abono)',
      );
    }

    if (!dto.metodoPago) {
      throw new UnprocessableEntityException('metodoPago es requerido para registrar un pago');
    }

    if (dto.monto !== undefined) {
      payment.monto = dto.monto;
    }

    payment.estadoPago = destino;
    payment.metodoPago = dto.metodoPago;
    payment.fechaPago = dto.fechaPago ? new Date(dto.fechaPago) : new Date();
    return payment;
  }
}
