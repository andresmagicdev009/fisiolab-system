import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisService } from '../../common/redis/redis.service';
import { CK, TTL } from '../../common/redis/cache-keys';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { Invoice } from './entities/invoice.entity';
import { SessionPayment, EstadoPago } from '../session-payments/entities/session-payment.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoiceQueryDto } from './dto/invoice-query.dto';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly repo: Repository<Invoice>,
    @InjectRepository(SessionPayment)
    private readonly paymentRepo: Repository<SessionPayment>,
    private readonly redis: RedisService,
  ) {}

  // ─── Create ──────────────────────────────────────────────────────────────────

  async create(paymentId: string, dto: CreateInvoiceDto): Promise<Invoice> {
    const payment = await this.paymentRepo.findOne({ where: { id: paymentId } });
    if (!payment) throw new NotFoundException(`Pago ${paymentId} no encontrado`);

    if (payment.estadoPago !== EstadoPago.PAGADO) {
      throw new UnprocessableEntityException(
        'Solo se puede emitir factura para pagos en estado PAGADO',
      );
    }

    if (dto.numeroFactura) {
      const existing = await this.repo.findOne({
        where: { numeroFactura: dto.numeroFactura },
        select: ['id'],
      });
      if (existing) {
        throw new ConflictException(`Número de factura ${dto.numeroFactura} ya existe`);
      }
    }

    const invoice = this.repo.create({
      paymentId,
      numeroFactura: dto.numeroFactura ?? null,
      rucEmisor: dto.rucEmisor ?? null,
      claveAcceso: dto.claveAcceso ?? null,
      autorizacionSri: dto.autorizacionSri ?? null,
      xmlFactura: dto.xmlFactura ?? null,
    });

    const saved = await this.repo.save(invoice);
    await this.redis.del(CK.PAYMENT_ID(paymentId));
    return saved;
  }

  // ─── Find all by payment ─────────────────────────────────────────────────────

  async findByPayment(
    paymentId: string,
    query: InvoiceQueryDto,
  ): Promise<PaginatedResponseDto<Invoice>> {
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId },
      select: ['id'],
    });
    if (!payment) throw new NotFoundException(`Pago ${paymentId} no encontrado`);

    const { page, limit } = query;
    const [data, total] = await this.repo.findAndCount({
      where: { paymentId },
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return PaginatedResponseDto.of(data, total, page, limit);
  }

  // ─── Find one ────────────────────────────────────────────────────────────────

  async findOne(paymentId: string, invoiceId: string): Promise<Invoice> {
    const cached = await this.redis.get<Invoice>(CK.INVOICE_ID(invoiceId));
    if (cached) return cached;

    const invoice = await this.repo.findOne({
      where: { id: invoiceId, paymentId },
    });
    if (!invoice) {
      throw new NotFoundException(`Factura ${invoiceId} no encontrada para este pago`);
    }

    await this.redis.set(CK.INVOICE_ID(invoiceId), invoice, TTL.RECORD);
    return invoice;
  }
}
