import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Patient } from '../patients/entities/patient.entity';
import { TarjeteroIndice, EstadoTarjetero } from '../tarjetero-indice/entities/tarjetero-indice.entity';
import { ClinicalEpisode } from '../clinical-episodes/entities/clinical-episode.entity';
import { UsersService } from '../users/users.service';
import { SessionsService } from '../sessions/sessions.service';
import { RedisService } from '../../common/redis/redis.service';
import { CK, TTL } from '../../common/redis/cache-keys';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { Appointment, AppointmentBookingType, EstadoCita, TipoCita } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { CompleteAppointmentDto } from './dto/complete-appointment.dto';
import { CompleteAppointmentResponseDto } from './dto/complete-appointment-response.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { AppointmentQueryDto } from './dto/appointment-query.dto';
import { EnrichedAppointment } from './dto/enriched-appointment.dto';
import { AppointmentStateFactory } from './factories/appointment-state.factory';
import { WaitingListService } from './waiting-list.service';
import { SlotFinderService } from './slot-finder.service';

const REQUIRES_EPISODE = [TipoCita.SEGUIMIENTO, TipoCita.INTERCONSULTA];

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly repo: Repository<Appointment>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(TarjeteroIndice)
    private readonly tarjeteroRepo: Repository<TarjeteroIndice>,
    @InjectRepository(ClinicalEpisode)
    private readonly episodeRepo: Repository<ClinicalEpisode>,
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly waitingListService: WaitingListService,
    private readonly slotFinder: SlotFinderService,
    private readonly redis: RedisService,
  ) {}

  // ─── Create ──────────────────────────────────────────────────────────────────

  async create(dto: CreateAppointmentDto): Promise<Appointment> {
    const patient = await this.patientRepo.findOne({
      where: { id: dto.patientId },
      select: ['id'],
    });
    if (!patient) throw new NotFoundException(`Paciente ${dto.patientId} no encontrado`);

    const tarjetero = await this.tarjeteroRepo.findOne({
      where: { pacienteId: dto.patientId },
      select: ['id', 'estado'],
    });
    if (!tarjetero || tarjetero.estado !== EstadoTarjetero.ACTIVO) {
      throw new UnprocessableEntityException(
        'Paciente sin tarjetero índice activo — cree el tarjetero antes de agendar',
      );
    }

    const scheduledAt = new Date(dto.scheduledAt);
    if (scheduledAt <= new Date()) {
      throw new BadRequestException('scheduledAt no puede ser en el pasado');
    }

    const durationMinutes = dto.durationMinutes ?? 60;

    // Capacity-aware con bloqueo pesimista
    const saved = await this.dataSource.transaction(async (manager) => {
      const fecha = toDateStr(scheduledAt);
      const hora = toTimeStr(scheduledAt);

      const cap = await this.slotFinder.validateSlotCapacity(
        dto.professionalId,
        fecha,
        hora,
        durationMinutes,
        null,
        manager,
      );
      if (!cap.disponible) {
        const suggested = await this.slotFinder.findFreeSlots(
          dto.professionalId,
          fecha,
          durationMinutes,
        );
        throw new ConflictException({
          error: 'CONFLICT',
          message: `Capacidad alcanzada (${cap.ocupados}/${cap.capacidad})`,
          ocupados: cap.ocupados,
          capacidad: cap.capacidad,
          suggestedSlots: suggested,
        });
      }

      const appointment = manager.create(Appointment, {
        patientId: dto.patientId,
        professionalId: dto.professionalId,
        scheduledAt,
        durationMinutes,
        tipoCita: dto.tipoCita,
        bookingType: dto.bookingType ?? AppointmentBookingType.PRE_BOOK,
        estado: EstadoCita.CONFIRMADA,
        motivo: dto.motivo ?? null,
        notas: dto.notas ?? null,
        motivoCancelacion: null,
        episodeId: null,
        sessionPaymentId: null,
        sessionId: null,
        treatmentPlanId: null,
        reprogramadaDeId: null,
        nuevaCitaId: null,
        motivoReprogramacion: null,
        intentosReagendamiento: 0,
        esReprogNoShow: false,
      });
      return manager.save(Appointment, appointment);
    });

    await this.redis.del(CK.APPT_PATIENT(dto.patientId));
    return saved;
  }

  // ─── Find all (global) ───────────────────────────────────────────────────────

  async findAll(
    query: AppointmentQueryDto,
    clerkUserId: string,
    userRole: string,
  ): Promise<PaginatedResponseDto<Appointment>> {
    const { page, limit, estado, tipoCita, professionalId, patientId, desde, hasta } = query;

    const qb = this.repo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.patient', 'p')
      .orderBy('a.scheduledAt', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (userRole !== 'admin' && userRole !== 'pasante') {
      const dbUser = await this.usersService.findByExternalId(clerkUserId);
      if (!dbUser) throw new ForbiddenException('Usuario no registrado en sistema');
      qb.andWhere('a.professional_id = :selfId', { selfId: dbUser.id });
    } else if (professionalId) {
      qb.andWhere('a.professional_id = :professionalId', { professionalId });
    }

    if (estado)    qb.andWhere('a.estado = :estado', { estado });
    if (tipoCita)  qb.andWhere('a.tipo_cita = :tipoCita', { tipoCita });
    if (patientId) qb.andWhere('a.patient_id = :patientId', { patientId });
    if (desde)     qb.andWhere('DATE(a.scheduled_at) >= :desde', { desde });
    if (hasta)     qb.andWhere('DATE(a.scheduled_at) <= :hasta', { hasta });

    const [data, total] = await qb.getManyAndCount();
    return PaginatedResponseDto.of(data, total, page, limit);
  }

  // ─── Find all by patient (enriched) ─────────────────────────────────────────

  async findAllByPatient(
    patientId: string,
    query: AppointmentQueryDto,
    clerkUserId: string,
    userRole: string,
  ): Promise<PaginatedResponseDto<EnrichedAppointment>> {
    const patient = await this.patientRepo.findOne({ where: { id: patientId }, select: ['id'] });
    if (!patient) throw new NotFoundException(`Paciente ${patientId} no encontrado`);

    const { page, limit, estado, tipoCita, desde, hasta } = query;

    // Base query for pagination
    const qb = this.repo
      .createQueryBuilder('a')
      .where('a.patient_id = :patientId', { patientId })
      .orderBy('a.scheduled_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    // Scoping: non-admin/pasante professionals see only their own
    if (userRole !== 'admin' && userRole !== 'pasante') {
      const dbUser = await this.usersService.findByExternalId(clerkUserId);
      if (!dbUser) throw new ForbiddenException('Usuario no registrado en sistema');
      qb.andWhere('a.professional_id = :selfId', { selfId: dbUser.id });
    }

    if (estado)   qb.andWhere('a.estado = :estado', { estado });
    if (tipoCita) qb.andWhere('a.tipo_cita = :tipoCita', { tipoCita });
    if (desde)    qb.andWhere('DATE(a.scheduled_at) >= :desde', { desde });
    if (hasta)    qb.andWhere('DATE(a.scheduled_at) <= :hasta', { hasta });

    const [appointments, total] = await qb.getManyAndCount();

    if (appointments.length === 0) {
      return PaginatedResponseDto.of([], total, page, limit);
    }

    const ids = appointments.map((a) => a.id);

    // Batch enrichment — single JOIN query for all fetched IDs
    const rows = await this.dataSource.query<Record<string, unknown>[]>(
      `SELECT
         a.id                  AS appt_id,
         e.codigo_hc           AS ep_codigo_hc,
         e.motivo_consulta     AS ep_motivo_consulta,
         e.estado              AS ep_estado,
         s.id                  AS ses_id,
         s.numero_sesion       AS ses_numero_sesion,
         s.estado              AS ses_estado,
         tp.objetivo_terapeutico AS plan_nombre,
         sp.monto              AS pay_monto,
         sp.estado_pago        AS pay_estado_pago,
         orig.id               AS reprog_id,
         orig.scheduled_at     AS reprog_scheduled_at,
         nueva.id              AS nueva_id,
         nueva.scheduled_at    AS nueva_scheduled_at,
         nueva.estado          AS nueva_estado
       FROM appointments a
       LEFT JOIN clinical_episodes e  ON a.episode_id          = e.id
       LEFT JOIN sessions s           ON s.appointment_id      = a.id
       LEFT JOIN treatment_plans tp   ON s.plan_id             = tp.id
       LEFT JOIN session_payments sp  ON a.session_payment_id  = sp.id
       LEFT JOIN appointments orig    ON a.reprogramada_de_id  = orig.id
       LEFT JOIN appointments nueva   ON a.nueva_cita_id       = nueva.id
       WHERE a.id = ANY($1::uuid[])`,
      [ids],
    );

    const rowMap = new Map<string, Record<string, unknown>>(
      rows.map((r) => [r['appt_id'] as string, r]),
    );

    const enriched: EnrichedAppointment[] = appointments.map((appt) => {
      const r = rowMap.get(appt.id) ?? {};
      return {
        ...appt,
        episode: r['ep_codigo_hc']
          ? {
              codigoHc: r['ep_codigo_hc'] as string,
              motivoConsulta: r['ep_motivo_consulta'] as string,
              estado: r['ep_estado'] as string,
            }
          : null,
        session: r['ses_id']
          ? {
              id: r['ses_id'] as string,
              numeroSesion: Number(r['ses_numero_sesion']),
              estado: r['ses_estado'] as string,
              plan: r['plan_nombre'] ? { objetivoTerapeutico: r['plan_nombre'] as string } : null,
            }
          : null,
        payment: r['pay_monto'] != null
          ? { monto: Number(r['pay_monto']), estadoPago: r['pay_estado_pago'] as string }
          : null,
        reprogramadaDe: r['reprog_id']
          ? { id: r['reprog_id'] as string, scheduledAt: r['reprog_scheduled_at'] as Date }
          : null,
        nuevaCita: r['nueva_id']
          ? {
              id: r['nueva_id'] as string,
              scheduledAt: r['nueva_scheduled_at'] as Date,
              estado: r['nueva_estado'] as string,
            }
          : null,
      };
    });

    return PaginatedResponseDto.of(enriched, total, page, limit);
  }

  // ─── Find one ────────────────────────────────────────────────────────────────

  async findOne(id: string): Promise<Appointment> {
    const cached = await this.redis.get<Appointment>(CK.APPT_ID(id));
    if (cached) return cached;

    const appointment = await this.repo.findOne({
      where: { id },
      relations: ['patient'],
    });
    if (!appointment) throw new NotFoundException(`Cita ${id} no encontrada`);

    await this.redis.set(CK.APPT_ID(id), appointment, TTL.LIST);
    return appointment;
  }

  // ─── Update ──────────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateAppointmentDto): Promise<Appointment> {
    const appointment = await this.repo.findOne({ where: { id } });
    if (!appointment) throw new NotFoundException(`Cita ${id} no encontrada`);

    AppointmentStateFactory.get(appointment.estado).assertCanPatch();

    if (dto.scheduledAt !== undefined) {
      const newDate = new Date(dto.scheduledAt);
      if (newDate <= new Date()) throw new BadRequestException('scheduledAt no puede ser en el pasado');
      const duration = dto.durationMinutes ?? appointment.durationMinutes;
      const profId = dto.professionalId ?? appointment.professionalId;

      const cap = await this.slotFinder.validateSlotCapacity(
        profId,
        toDateStr(newDate),
        toTimeStr(newDate),
        duration,
        id,
      );
      if (!cap.disponible) {
        const suggested = await this.slotFinder.findFreeSlots(
          profId,
          toDateStr(newDate),
          duration,
        );
        throw new ConflictException({
          error: 'CONFLICT',
          message: `Capacidad alcanzada (${cap.ocupados}/${cap.capacidad})`,
          suggestedSlots: suggested,
        });
      }
      appointment.scheduledAt = newDate;
    }

    if (dto.professionalId !== undefined) appointment.professionalId = dto.professionalId;
    if (dto.durationMinutes !== undefined) appointment.durationMinutes = dto.durationMinutes;
    if (dto.motivo !== undefined) appointment.motivo = dto.motivo;
    if (dto.notas !== undefined) appointment.notas = dto.notas;

    const saved = await this.repo.save(appointment);

    // Si está vinculada a sesión, sincronizar fechaSesion
    if (saved.sessionId && dto.scheduledAt !== undefined) {
      await this.dataSource.query(
        `UPDATE sessions SET fecha_sesion = $1 WHERE id = $2`,
        [toDateStr(saved.scheduledAt), saved.sessionId],
      );
    }

    await this.invalidateCache(saved);
    return saved;
  }

  // ─── Cancel ──────────────────────────────────────────────────────────────────

  async cancel(id: string, dto: CancelAppointmentDto): Promise<Appointment> {
    const appointment = await this.repo.findOne({ where: { id } });
    if (!appointment) throw new NotFoundException(`Cita ${id} no encontrada`);

    AppointmentStateFactory.get(appointment.estado).assertCanCancel();

    appointment.estado = EstadoCita.CANCELADA;
    appointment.motivoCancelacion = dto.motivoCancelacion;

    const saved = await this.repo.save(appointment);
    await this.invalidateCache(saved);
    return saved;
  }

  // ─── Complete ────────────────────────────────────────────────────────────────

  async complete(
    id: string,
    dto: CompleteAppointmentDto,
    clerkUserId: string,
    userRole: string,
  ): Promise<CompleteAppointmentResponseDto> {
    const appointment = await this.repo.findOne({ where: { id } });
    if (!appointment) throw new NotFoundException(`Cita ${id} no encontrada`);

    AppointmentStateFactory.get(appointment.estado).assertCanComplete();

    if (userRole !== 'admin') {
      const dbUser = await this.usersService.findByExternalId(clerkUserId);
      if (!dbUser || dbUser.id !== appointment.professionalId) {
        throw new ForbiddenException('Solo el profesional asignado o admin puede completar esta cita');
      }
    }

    // episodeId required for SEGUIMIENTO / INTERCONSULTA
    if (REQUIRES_EPISODE.includes(appointment.tipoCita) && !dto.episodeId) {
      throw new BadRequestException(
        `episodeId requerido para citas de tipo ${appointment.tipoCita}`,
      );
    }

    // Validate episode
    let episode: ClinicalEpisode | null = null;
    if (dto.episodeId) {
      episode = await this.episodeRepo.findOne({
        where: { id: dto.episodeId, pacienteId: appointment.patientId },
      });
      if (!episode) {
        throw new NotFoundException(`Episodio ${dto.episodeId} no encontrado para este paciente`);
      }
    }

    // CASO 3: validate plan (raw query — avoids injecting TreatmentPlan repo)
    let planCodigoHc: string | null = null;
    if (dto.planId) {
      if (!dto.episodeId) throw new BadRequestException('planId requiere episodeId');
      const planRows = await this.dataSource.query<{ id: string; estado: string; codigo_hc: string }[]>(
        `SELECT id, estado, codigo_hc FROM treatment_plans WHERE id = $1 AND episode_id = $2`,
        [dto.planId, dto.episodeId],
      );
      if (!planRows.length) {
        throw new NotFoundException(`Plan ${dto.planId} no encontrado en este episodio`);
      }
      const plan = planRows[0];
      if (plan.estado !== 'activo') {
        throw new UnprocessableEntityException(
          `Plan ${plan.estado} — solo planes activos aceptan sesiones automáticas`,
        );
      }
      planCodigoHc = plan.codigo_hc;
    }

    return this.dataSource.transaction(async (manager) => {
      // Auto-create session_payment
      const paymentResult = await manager.query<{ id: string }[]>(
        `INSERT INTO session_payments (appointment_id, monto, estado_pago, created_at)
         VALUES ($1, $2, 'PENDIENTE', now())
         RETURNING id`,
        [id, dto.monto],
      );
      const sessionPaymentId = paymentResult[0].id;

      appointment.estado = EstadoCita.COMPLETADA;
      appointment.episodeId = dto.episodeId ?? null;
      appointment.sessionPaymentId = sessionPaymentId;

      const saved = await manager.save(Appointment, appointment);

      // CASO 3: auto-create Session within same transaction
      let sessionId: string | null = null;
      if (dto.planId && dto.episodeId && episode) {
        const codigoHc = planCodigoHc ?? episode.codigoHc;
        const fechaBase = new Date(appointment.scheduledAt);
        const fechaSesion = new Date(fechaBase.getFullYear(), fechaBase.getMonth(), fechaBase.getDate());

        const autoSession = await this.sessionsService.createAutoSession(manager, {
          planId: dto.planId,
          episodeId: dto.episodeId,
          codigoHc,
          pacienteId: appointment.patientId,
          profesionalId: appointment.professionalId,
          appointmentId: id,
          fechaSesion,
        });
        sessionId = autoSession.id;
      }

      await this.invalidateCache(saved);
      return { appointment: saved, sessionId };
    });
  }

  // ─── Reschedule ──────────────────────────────────────────────────────────────

  async reschedule(
    id: string,
    dto: RescheduleAppointmentDto,
  ): Promise<{ original: Appointment; nueva: Appointment }> {
    const newDate = new Date(dto.scheduledAt);
    if (newDate <= new Date()) {
      throw new BadRequestException('scheduledAt no puede ser en el pasado');
    }

    return this.dataSource.transaction(async (manager) => {
      // Pessimistic lock — prevents TOCTOU on conflict check
      const original = await manager.findOne(Appointment, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!original) throw new NotFoundException(`Cita ${id} no encontrada`);

      AppointmentStateFactory.get(original.estado).assertCanReschedule();

      if (original.intentosReagendamiento >= 3) {
        throw new UnprocessableEntityException(
          'Límite de reagendamientos alcanzado (3). Contactar recepción para asistencia.',
        );
      }

      // Capacity check bajo lock pesimista
      const cap = await this.slotFinder.validateSlotCapacity(
        original.professionalId,
        toDateStr(newDate),
        toTimeStr(newDate),
        original.durationMinutes,
        null,
        manager,
      );
      if (!cap.disponible) {
        const suggested = await this.slotFinder.findFreeSlots(
          original.professionalId,
          toDateStr(newDate),
          original.durationMinutes,
        );
        throw new ConflictException({
          error: 'CONFLICT',
          message: `Capacidad alcanzada (${cap.ocupados}/${cap.capacidad})`,
          suggestedSlots: suggested,
        });
      }

      // Create nueva cita (copies from original)
      const nueva = manager.create(Appointment, {
        patientId: original.patientId,
        professionalId: original.professionalId,
        scheduledAt: newDate,
        durationMinutes: original.durationMinutes,
        tipoCita: original.tipoCita,
        bookingType: original.bookingType,
        motivo: original.motivo,
        notas: original.notas,
        estado: EstadoCita.CONFIRMADA,
        motivoCancelacion: null,
        episodeId: null,
        sessionPaymentId: null,
        reprogramadaDeId: original.id,
        nuevaCitaId: null,
        motivoReprogramacion: null,
        intentosReagendamiento: original.intentosReagendamiento + 1,
        esReprogNoShow: false,
      });
      const savedNueva = await manager.save(Appointment, nueva);

      // Mark original as REPROGRAMADA
      original.estado = EstadoCita.REPROGRAMADA;
      original.nuevaCitaId = savedNueva.id;
      original.motivoReprogramacion = dto.motivo ?? null;
      const savedOriginal = await manager.save(Appointment, original);

      await Promise.all([
        this.redis.del(CK.APPT_ID(id)),
        this.redis.del(CK.APPT_PATIENT(original.patientId)),
      ]);

      return { original: savedOriginal, nueva: savedNueva };
    });
  }

  // ─── No-show ─────────────────────────────────────────────────────────────────

  async noShow(id: string): Promise<Appointment> {
    const appointment = await this.repo.findOne({ where: { id } });
    if (!appointment) throw new NotFoundException(`Cita ${id} no encontrada`);

    AppointmentStateFactory.get(appointment.estado).assertCanNoShow();

    appointment.estado = EstadoCita.NO_ASISTIO;
    const saved = await this.repo.save(appointment);
    await this.invalidateCache(saved);

    // Fire-and-forget: auto-assign waiting list entry for the freed slot
    this.waitingListService.autoAssignFromSlot(saved).catch(() => {
      // Non-critical — slot auto-assignment is best-effort
    });

    return saved;
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async invalidateCache(appointment: Appointment): Promise<void> {
    await Promise.all([
      this.redis.del(CK.APPT_ID(appointment.id)),
      this.redis.del(CK.APPT_PATIENT(appointment.patientId)),
    ]);
  }
}

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toTimeStr(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}
