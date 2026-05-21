import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisService } from '../../common/redis/redis.service';
import { CK, TTL } from '../../common/redis/cache-keys';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { SessionPayment } from './entities/session-payment.entity';
import { UpdateSessionPaymentDto } from './dto/update-session-payment.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';
import { PaymentStateFactory } from './factories/payment-state.factory';

@Injectable()
export class SessionPaymentsService {
  constructor(
    @InjectRepository(SessionPayment)
    private readonly repo: Repository<SessionPayment>,
    private readonly redis: RedisService,
  ) {}

  // ─── Find by patient ────────────────────────────────────────────────────────

  async findByPatient(
    patientId: string,
    query: PaymentQueryDto,
  ): Promise<PaginatedResponseDto<SessionPayment>> {
    const { page, limit, estadoPago, desde, hasta } = query;

    const qb = this.repo
      .createQueryBuilder('sp')
      .innerJoin('appointments', 'a', 'a.id = sp.appointment_id')
      .where('a.patient_id = :patientId', { patientId })
      .orderBy('sp.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (estadoPago) qb.andWhere('sp.estado_pago = :estadoPago', { estadoPago });
    if (desde) qb.andWhere('DATE(sp.created_at) >= :desde', { desde });
    if (hasta) qb.andWhere('DATE(sp.created_at) <= :hasta', { hasta });

    const [data, total] = await qb.getManyAndCount();
    return PaginatedResponseDto.of(data, total, page, limit);
  }

  // ─── Find all (admin) ────────────────────────────────────────────────────────

  async findAll(query: PaymentQueryDto): Promise<PaginatedResponseDto<SessionPayment>> {
    const { page, limit, estadoPago, desde, hasta } = query;

    const qb = this.repo
      .createQueryBuilder('sp')
      .orderBy('sp.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (estadoPago) qb.andWhere('sp.estado_pago = :estadoPago', { estadoPago });
    if (desde) qb.andWhere('DATE(sp.created_at) >= :desde', { desde });
    if (hasta) qb.andWhere('DATE(sp.created_at) <= :hasta', { hasta });

    const [data, total] = await qb.getManyAndCount();
    return PaginatedResponseDto.of(data, total, page, limit);
  }

  // ─── Find one ────────────────────────────────────────────────────────────────

  async findOne(id: string): Promise<SessionPayment> {
    const cached = await this.redis.get<SessionPayment>(CK.PAYMENT_ID(id));
    if (cached) return cached;

    const payment = await this.repo.findOne({ where: { id } });
    if (!payment) throw new NotFoundException(`Pago ${id} no encontrado`);

    await this.redis.set(CK.PAYMENT_ID(id), payment, TTL.RECORD);
    return payment;
  }

  // ─── Pay (State Pattern) ─────────────────────────────────────────────────────

  async pay(id: string, dto: UpdateSessionPaymentDto): Promise<SessionPayment> {
    const payment = await this.repo.findOne({ where: { id } });
    if (!payment) throw new NotFoundException(`Pago ${id} no encontrado`);

    const state = PaymentStateFactory.get(payment.estadoPago);
    const updated = state.pay(payment, dto);

    const saved = await this.repo.save(updated);
    await this.redis.del(CK.PAYMENT_ID(id));
    return saved;
  }
}
