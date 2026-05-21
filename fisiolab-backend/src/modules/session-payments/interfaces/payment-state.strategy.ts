import { EstadoPago, SessionPayment } from '../entities/session-payment.entity';
import { UpdateSessionPaymentDto } from '../dto/update-session-payment.dto';

export abstract class PaymentStateStrategy {
  abstract readonly estadoPago: EstadoPago;

  /**
   * Applies payment transition. Returns mutated (not yet saved) SessionPayment.
   * Throws UnprocessableEntityException if transition is not allowed.
   */
  abstract pay(payment: SessionPayment, dto: UpdateSessionPaymentDto): SessionPayment;
}
