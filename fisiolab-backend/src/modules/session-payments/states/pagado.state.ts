import { UnprocessableEntityException } from '@nestjs/common';
import { PaymentStateStrategy } from '../interfaces/payment-state.strategy';
import { EstadoPago, SessionPayment } from '../entities/session-payment.entity';
import { UpdateSessionPaymentDto } from '../dto/update-session-payment.dto';

export class PagadoState extends PaymentStateStrategy {
  readonly estadoPago = EstadoPago.PAGADO;

  pay(_payment: SessionPayment, _dto: UpdateSessionPaymentDto): SessionPayment {
    throw new UnprocessableEntityException('Pago ya completado — no se puede modificar');
  }
}
