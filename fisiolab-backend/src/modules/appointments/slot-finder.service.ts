import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, EntityManager, In, Not, Repository } from 'typeorm';
import { RedisService } from '../../common/redis/redis.service';
import { CK } from '../../common/redis/cache-keys';
import { User } from '../users/entities/user.entity';
import { Availability, DayOfWeek } from './entities/availability.entity';
import { Appointment, AppointmentBookingType, EstadoCita } from './entities/appointment.entity';
import { FindSlotsDto, SlotDto } from './dto/find-slots.dto';
import {
  FreeSlotInfo,
  ProposedSlotDto,
  SlotValidationResult,
  ValidateScheduleResponseDto,
} from './dto/slot-validation.dto';

const DAY_MAP: Record<number, DayOfWeek> = {
  0: DayOfWeek.SUNDAY,
  1: DayOfWeek.MONDAY,
  2: DayOfWeek.TUESDAY,
  3: DayOfWeek.WEDNESDAY,
  4: DayOfWeek.THURSDAY,
  5: DayOfWeek.FRIDAY,
  6: DayOfWeek.SATURDAY,
};

const ACTIVE_STATES = [EstadoCita.CONFIRMADA, EstadoCita.COMPLETADA, EstadoCita.REPROGRAMADA];
const INACTIVE_STATES = [EstadoCita.CANCELADA, EstadoCita.NO_ASISTIO];

export interface CapacityCheck {
  disponible: boolean;
  ocupados: number;
  capacidad: number;
  cupoDisponible: number;
}

@Injectable()
export class SlotFinderService {
  constructor(
    @InjectRepository(Availability)
    private readonly availRepo: Repository<Availability>,
    @InjectRepository(Appointment)
    private readonly apptRepo: Repository<Appointment>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly redis: RedisService,
  ) {}

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Carga la capacidad de atención en paralelo del profesional.
   * Cachea para evitar lecturas repetidas durante validaciones masivas.
   */
  async getCapacidad(professionalId: string, manager?: EntityManager): Promise<number> {
    const repo = manager ? manager.getRepository(User) : this.userRepo;
    const user = await repo.findOne({
      where: { id: professionalId },
      select: ['id', 'capacidadAtencionParalela'],
    });
    if (!user) throw new NotFoundException(`Profesional ${professionalId} no existe`);
    return user.capacidadAtencionParalela ?? 1;
  }

  /**
   * Cuenta citas activas en un slot puntual y compara contra capacidad.
   * Si `manager` se pasa, usa bloqueo pesimista para anti-concurrencia.
   */
  async validateSlotCapacity(
    professionalId: string,
    fecha: string,
    hora: string,
    durationMinutes: number,
    excludeAppointmentId?: string | null,
    manager?: EntityManager,
  ): Promise<CapacityCheck> {
    const capacidad = await this.getCapacidad(professionalId, manager);

    const start = new Date(`${fecha}T${hora}:00`);
    const end = new Date(start.getTime() + durationMinutes * 60_000);

    const repo = manager ? manager.getRepository(Appointment) : this.apptRepo;
    const qb = repo
      .createQueryBuilder('a')
      .where('a.professional_id = :pid', { pid: professionalId })
      .andWhere('a.estado NOT IN (:...inactive)', { inactive: INACTIVE_STATES })
      .andWhere('a.scheduled_at < :end', { end })
      .andWhere(
        `a.scheduled_at + (a.duration_minutes * interval '1 minute') > :start`,
        { start },
      );

    if (excludeAppointmentId) qb.andWhere('a.id != :ex', { ex: excludeAppointmentId });

    if (manager) qb.setLock('pessimistic_write');

    const ocupados = await qb.getCount();
    const cupoDisponible = Math.max(0, capacidad - ocupados);

    return {
      disponible: ocupados < capacidad,
      ocupados,
      capacidad,
      cupoDisponible,
    };
  }

  /**
   * Devuelve slots con cupo disponible para un día concreto.
   * Usado para sugerencias cuando un slot está lleno.
   */
  async findFreeSlots(
    professionalId: string,
    fecha: string,
    durationMinutes: number,
  ): Promise<FreeSlotInfo[]> {
    const dayOfWeek = DAY_MAP[new Date(`${fecha}T12:00:00`).getDay()];
    const availabilities = await this.availRepo.find({
      where: { professionalId, dayOfWeek, isActive: true },
    });
    if (availabilities.length === 0) return [];

    const free: FreeSlotInfo[] = [];
    for (const avail of availabilities) {
      if (!this.isEffective(avail, fecha)) continue;

      const theoreticals = this.generateSlots(avail, fecha, durationMinutes);
      for (const slot of theoreticals) {
        const cap = await this.validateSlotCapacity(
          professionalId,
          slot.fecha,
          slot.hora,
          durationMinutes,
        );
        if (cap.disponible) {
          free.push({ hora: slot.hora, cupoDisponible: cap.cupoDisponible });
        }
      }
    }
    return free;
  }

  /**
   * Valida una lista de slots propuestos contra capacidad y retorna sugerencias.
   * Sin efectos secundarios — usado para preview en formularios.
   */
  async validateProposedSchedule(
    professionalId: string,
    proposedSlots: ProposedSlotDto[],
  ): Promise<ValidateScheduleResponseDto> {
    const results: SlotValidationResult[] = [];
    for (const s of proposedSlots) {
      const cap = await this.validateSlotCapacity(professionalId, s.fecha, s.hora, s.duracion);
      const row: SlotValidationResult = { fecha: s.fecha, hora: s.hora, ...cap };
      if (!cap.disponible) {
        row.suggestedSlots = await this.findFreeSlots(professionalId, s.fecha, s.duracion);
      }
      results.push(row);
    }
    return { results, allValid: results.every((r) => r.disponible) };
  }

  /**
   * Lista todos los slots (con/sin cupo) en un rango. Usado para vista calendario.
   */
  async findAvailableSlots(dto: FindSlotsDto): Promise<SlotDto[]> {
    this.validateBookingTypeRules(dto);

    const cacheKey = CK.SLOTS(
      dto.professionalId ?? 'all',
      dto.startDate,
      dto.endDate,
      dto.bookingType,
    );
    const cached = await this.redis.get<SlotDto[]>(cacheKey);
    if (cached) return cached;

    const availWhere: Record<string, unknown> = { isActive: true };
    if (dto.professionalId) availWhere['professionalId'] = dto.professionalId;

    const availabilities = await this.availRepo.find({ where: availWhere });
    if (availabilities.length === 0) return [];

    const availMap = new Map<DayOfWeek, Availability[]>();
    for (const a of availabilities) {
      const list = availMap.get(a.dayOfWeek) ?? [];
      list.push(a);
      availMap.set(a.dayOfWeek, list);
    }

    const rangeStart = new Date(`${dto.startDate}T00:00:00`);
    const rangeEnd = new Date(`${dto.endDate}T23:59:59`);

    const bookedWhere: Record<string, unknown> = {
      estado: Not(In(INACTIVE_STATES)),
      scheduledAt: Between(rangeStart, rangeEnd),
    };
    if (dto.professionalId) bookedWhere['professionalId'] = dto.professionalId;

    const booked = await this.apptRepo.find({
      where: bookedWhere,
      select: ['scheduledAt', 'durationMinutes', 'professionalId'],
    });

    const profIds = new Set<string>();
    for (const a of availabilities) profIds.add(a.professionalId);
    const profUsers = await this.userRepo.find({
      where: { id: In([...profIds]) },
      select: ['id', 'capacidadAtencionParalela'],
    });
    const capMap = new Map<string, number>(
      profUsers.map((u) => [u.id, u.capacidadAtencionParalela ?? 1]),
    );

    const slots: SlotDto[] = [];
    const cursor = new Date(`${dto.startDate}T00:00:00`);
    const end = new Date(`${dto.endDate}T00:00:00`);

    while (cursor <= end) {
      const dayOfWeek = DAY_MAP[cursor.getDay()];
      const dayAvails = availMap.get(dayOfWeek) ?? [];
      const dateStr = toDateStr(cursor);

      for (const avail of dayAvails) {
        if (!this.isEffective(avail, dateStr)) continue;

        const capacidad = capMap.get(avail.professionalId) ?? 1;
        const theoreticals = this.generateSlots(avail, dateStr, dto.duracion);
        for (const slot of theoreticals) {
          const ocupados = this.countOverlapping(slot, booked, slot.duracion, avail.professionalId);
          const cupoDisponible = Math.max(0, capacidad - ocupados);
          slots.push({
            ...slot,
            professionalId: avail.professionalId,
            disponible: ocupados < capacidad,
            ocupados,
            capacidad,
            cupoDisponible,
          });
        }
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    await this.redis.set(cacheKey, slots, 60);
    return slots;
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private validateBookingTypeRules(dto: FindSlotsDto): void {
    const todayStr = toDateStr(new Date());
    const tomorrowStr = toDateStr(addDays(new Date(), 1));

    if (dto.bookingType === AppointmentBookingType.SDA) {
      if (dto.startDate !== todayStr || dto.endDate !== todayStr) {
        throw new UnprocessableEntityException('Citas SDA solo para el día de hoy');
      }
    }

    if (dto.bookingType === AppointmentBookingType.PRE_BOOK) {
      if (dto.startDate < tomorrowStr) {
        throw new UnprocessableEntityException('Citas PRE_BOOK requieren fecha desde mañana en adelante');
      }
    }
  }

  private isEffective(avail: Availability, dateStr: string): boolean {
    if (avail.effectiveFrom && dateStr < avail.effectiveFrom) return false;
    if (avail.effectiveUntil && dateStr > avail.effectiveUntil) return false;
    return true;
  }

  private generateSlots(
    avail: Availability,
    dateStr: string,
    overrideDuration?: number,
  ): Omit<SlotDto, 'professionalId' | 'disponible' | 'ocupados' | 'capacidad' | 'cupoDisponible'>[] {
    const duration = overrideDuration ?? avail.slotDurationMinutes;
    const slots: Omit<SlotDto, 'professionalId' | 'disponible' | 'ocupados' | 'capacidad' | 'cupoDisponible'>[] = [];

    const [sh, sm] = avail.startTime.split(':').map(Number);
    const [eh, em] = avail.endTime.split(':').map(Number);

    let cur = sh * 60 + sm;
    const endMin = eh * 60 + em;

    while (cur + duration <= endMin) {
      const h = String(Math.floor(cur / 60)).padStart(2, '0');
      const m = String(cur % 60).padStart(2, '0');
      slots.push({ fecha: dateStr, hora: `${h}:${m}`, duracion: duration });
      cur += duration + avail.breakDurationMinutes;
    }

    return slots;
  }

  private countOverlapping(
    slot: { fecha: string; hora: string },
    booked: { scheduledAt: Date; durationMinutes: number; professionalId: string }[],
    slotDuration: number,
    professionalId: string,
  ): number {
    const slotStart = new Date(`${slot.fecha}T${slot.hora}:00`);
    const slotEnd = new Date(slotStart.getTime() + slotDuration * 60_000);

    let n = 0;
    for (const appt of booked) {
      if (appt.professionalId !== professionalId) continue;
      const apptStart = new Date(appt.scheduledAt);
      const apptEnd = new Date(apptStart.getTime() + appt.durationMinutes * 60_000);
      if (slotStart < apptEnd && slotEnd > apptStart) n++;
    }
    return n;
  }
}

function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
