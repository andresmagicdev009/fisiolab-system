import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { RedisService } from '../../common/redis/redis.service';
import { CK } from '../../common/redis/cache-keys';
import {
  ClinicalEpisode,
  EstadoEpisodio,
} from '../clinical-episodes/entities/clinical-episode.entity';
import { Patient } from '../patients/entities/patient.entity';
import {
  EstadoPlan,
  TreatmentPlan,
} from '../treatment-plans/entities/treatment-plan.entity';
import { EstadoSesion, Session, TipoSesion } from '../sessions/entities/session.entity';
import {
  Appointment,
  AppointmentBookingType,
  EstadoCita,
  TipoCita,
} from './entities/appointment.entity';
import { SlotFinderService } from './slot-finder.service';
import {
  CreatePlanWithScheduleDto,
  DAY_KEYS,
  SessionOverrideDto,
  SlotPropuesto,
  WeeklyScheduleConfigDto,
} from './dto/create-plan-with-schedule.dto';
import { FreeSlotInfo } from './dto/slot-validation.dto';

const ACTIVE_EPISODE_STATES = [EstadoEpisodio.ABIERTO, EstadoEpisodio.EN_TRATAMIENTO];
const MAX_DAYS_HORIZON = 365;

export interface PlanScheduleConflict {
  sessionIndex: number;
  fecha: string;
  hora: string;
  ocupados: number;
  capacidad: number;
  suggestedSlots: FreeSlotInfo[];
}

export interface PlanWithScheduleResult {
  plan: TreatmentPlan;
  sessions: Session[];
  appointments: Appointment[];
}

@Injectable()
export class PlanSchedulingService {
  constructor(
    @InjectRepository(TreatmentPlan)
    private readonly planRepo: Repository<TreatmentPlan>,
    @InjectRepository(ClinicalEpisode)
    private readonly episodeRepo: Repository<ClinicalEpisode>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    private readonly dataSource: DataSource,
    private readonly slotFinder: SlotFinderService,
    private readonly redis: RedisService,
  ) {}

  // ─── Public API ─────────────────────────────────────────────────────────────

  async createPlanWithSchedule(
    patientId: string,
    episodeId: string,
    dto: CreatePlanWithScheduleDto,
  ): Promise<PlanWithScheduleResult> {
    this.assertWeeklyScheduleValid(dto.weeklySchedule);

    const patient = await this.patientRepo.findOne({
      where: { id: patientId },
      select: ['id'],
    });
    if (!patient) throw new NotFoundException(`Paciente ${patientId} no encontrado`);

    const episode = await this.episodeRepo.findOne({
      where: { id: episodeId, pacienteId: patientId },
    });
    if (!episode) throw new NotFoundException(`Episodio ${episodeId} no encontrado`);
    if (!ACTIVE_EPISODE_STATES.includes(episode.estado)) {
      throw new UnprocessableEntityException(
        `Episodio ${episode.estado} — no acepta nuevos planes`,
      );
    }

    // Verifica capacidad existe (rechaza profesionalId inválido temprano)
    await this.slotFinder.getCapacidad(dto.professionalId);

    // 1. Generar fechas
    const dates = this.applyOverrides(
      this.generateSessionDates(
        dto.weeklySchedule,
        dto.numeroSesiones,
        dto.duracionMinutos,
        new Date(`${dto.startDate}T00:00:00`),
        dto.maxSesionesPorDia ?? 1,
      ),
      dto.overrides,
    );

    if (dates.length !== dto.numeroSesiones) {
      throw new UnprocessableEntityException(
        `Generadas ${dates.length} fechas pero se pidieron ${dto.numeroSesiones}`,
      );
    }

    // 2. Validar cupo de TODOS los slots ANTES de la transacción
    const conflicts: PlanScheduleConflict[] = [];
    for (const d of dates) {
      const cap = await this.slotFinder.validateSlotCapacity(
        dto.professionalId,
        d.fecha,
        d.horaInicio,
        dto.duracionMinutos,
      );
      if (!cap.disponible) {
        conflicts.push({
          sessionIndex: d.sessionIndex,
          fecha: d.fecha,
          hora: d.horaInicio,
          ocupados: cap.ocupados,
          capacidad: cap.capacidad,
          suggestedSlots: await this.slotFinder.findFreeSlots(
            dto.professionalId,
            d.fecha,
            dto.duracionMinutos,
          ),
        });
      }
    }
    if (conflicts.length > 0) {
      throw new ConflictException({
        message: 'Hay sesiones sin cupo que debes resolver',
        conflicts,
      });
    }

    // 3. Transacción atómica
    const result = await this.dataSource.transaction(async (manager) => {
      const [{ max }] = await manager.query<{ max: string | null }[]>(
        `SELECT MAX(numero_plan)::text AS max FROM treatment_plans WHERE episode_id = $1`,
        [episodeId],
      );
      const numeroPlan = (Number(max) || 0) + 1;

      const fechaInicio = dates[0].fecha;
      const fechaFin = dates[dates.length - 1].fecha;

      // Plan
      const planEntity = manager.create(TreatmentPlan, {
        episodeId,
        codigoHc: episode.codigoHc,
        pacienteId: patientId,
        profesionalId: dto.professionalId,
        numeroPlan,
        estado: EstadoPlan.ACTIVO,
        objetivoTerapeutico: dto.titulo,
        duracionEstimadaSemanas: null,
        frecuenciaSemanal: null,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        progresoPorcentaje: 0,
        appointmentId: null,
        observaciones: dto.observaciones ?? null,
        exercises: [],
      } as Partial<TreatmentPlan>);
      const savedPlan = await manager.save(TreatmentPlan, planEntity);

      const sessions: Session[] = [];
      const appointments: Appointment[] = [];

      for (let i = 0; i < dates.length; i++) {
        const d = dates[i];

        // Re-verificación bajo lock pesimista
        const cap = await this.slotFinder.validateSlotCapacity(
          dto.professionalId,
          d.fecha,
          d.horaInicio,
          dto.duracionMinutos,
          null,
          manager,
        );
        if (!cap.disponible) {
          throw new ConflictException({
            message: 'Cupo agotado durante el guardado — reintenta',
            conflict: { sessionIndex: d.sessionIndex, fecha: d.fecha, hora: d.horaInicio },
          });
        }

        const sessionEntity = manager.create(Session, {
          planId: savedPlan.id,
          episodeId,
          codigoHc: episode.codigoHc,
          pacienteId: patientId,
          profesionalId: dto.professionalId,
          tipo: TipoSesion.FISIOTERAPIA,
          estado: EstadoSesion.PROGRAMADA,
          numeroSesion: i + 1,
          fechaSesion: new Date(d.fecha),
          appointmentId: null,
          observaciones: null,
        });
        const savedSession = await manager.save(Session, sessionEntity);

        const scheduledAt = new Date(`${d.fecha}T${d.horaInicio}:00`);
        const apptEntity = manager.create(Appointment, {
          patientId,
          professionalId: dto.professionalId,
          scheduledAt,
          durationMinutes: dto.duracionMinutos,
          tipoCita: i === 0 ? TipoCita.PRIMERA_VEZ : TipoCita.SEGUIMIENTO,
          bookingType: AppointmentBookingType.PRE_BOOK,
          estado: EstadoCita.CONFIRMADA,
          motivo: dto.titulo,
          notas: null,
          motivoCancelacion: null,
          episodeId,
          sessionPaymentId: null,
          sessionId: savedSession.id,
          treatmentPlanId: savedPlan.id,
          reprogramadaDeId: null,
          nuevaCitaId: null,
          motivoReprogramacion: null,
          intentosReagendamiento: 0,
          esReprogNoShow: false,
        });
        const savedAppt = await manager.save(Appointment, apptEntity);

        // Link reverso session → appointment
        await manager.update(Session, savedSession.id, { appointmentId: savedAppt.id });
        savedSession.appointmentId = savedAppt.id;

        sessions.push(savedSession);
        appointments.push(savedAppt);
      }

      // Plan apunta a primera cita (start anchor)
      await manager.update(TreatmentPlan, savedPlan.id, { appointmentId: appointments[0].id });
      savedPlan.appointmentId = appointments[0].id;

      return { plan: savedPlan, sessions, appointments };
    });

    // Invalidar caches
    await Promise.all([
      this.redis.del(CK.APPT_PATIENT(patientId)),
      this.redis.del(CK.PLAN_ID(result.plan.id)),
    ]);

    return result;
  }

  // ─── Algorithm: date generation ────────────────────────────────────────────

  generateSessionDates(
    config: WeeklyScheduleConfigDto,
    numSesiones: number,
    duracionMin: number,
    startDate: Date,
    maxPorDia: number,
  ): SlotPropuesto[] {
    const slots: SlotPropuesto[] = [];
    const cursor = new Date(startDate);
    cursor.setHours(0, 0, 0, 0);
    const horizonLimit = new Date(cursor);
    horizonLimit.setDate(horizonLimit.getDate() + MAX_DAYS_HORIZON);

    while (slots.length < numSesiones) {
      if (cursor > horizonLimit) {
        throw new UnprocessableEntityException(
          'No hay suficiente disponibilidad para generar todas las sesiones (horizonte 1 año)',
        );
      }

      const dayKey = DAY_KEYS[cursor.getDay()];
      const dayConfig = (config as unknown as Record<string, { disponible: boolean; franjas: { inicio: string; fin: string }[] }>)[dayKey];

      if (dayConfig?.disponible && dayConfig.franjas.length > 0) {
        let sesionesHoy = 0;
        for (const franja of dayConfig.franjas) {
          let curMin = toMinutes(franja.inicio);
          const finMin = toMinutes(franja.fin);

          while (
            curMin + duracionMin <= finMin &&
            sesionesHoy < maxPorDia &&
            slots.length < numSesiones
          ) {
            slots.push({
              sessionIndex: slots.length + 1,
              fecha: toDateStr(cursor),
              horaInicio: fromMinutes(curMin),
              horaFin: fromMinutes(curMin + duracionMin),
              editado: false,
            });
            sesionesHoy++;
            curMin += duracionMin;
          }
          if (sesionesHoy >= maxPorDia) break;
        }
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    return slots;
  }

  applyOverrides(slots: SlotPropuesto[], overrides?: SessionOverrideDto[]): SlotPropuesto[] {
    if (!overrides || overrides.length === 0) return slots;

    const byIndex = new Map(slots.map((s) => [s.sessionIndex, s]));
    for (const ov of overrides) {
      const target = byIndex.get(ov.sessionIndex);
      if (!target) {
        throw new BadRequestException(`Override referencia sessionIndex inexistente: ${ov.sessionIndex}`);
      }
      const duracionMin = toMinutes(target.horaFin) - toMinutes(target.horaInicio);
      target.fecha = ov.fecha;
      target.horaInicio = ov.hora;
      target.horaFin = fromMinutes(toMinutes(ov.hora) + duracionMin);
      target.editado = true;
    }
    return slots;
  }

  // ─── Validation ────────────────────────────────────────────────────────────

  private assertWeeklyScheduleValid(config: WeeklyScheduleConfigDto): void {
    let totalFranjas = 0;
    for (const key of DAY_KEYS) {
      const day = (config as unknown as Record<string, { disponible: boolean; franjas: { inicio: string; fin: string }[] }>)[key];
      if (!day) {
        throw new BadRequestException(`Falta configuración del día ${key}`);
      }
      if (!day.disponible) continue;

      const ranges = day.franjas.map((f) => ({
        inicio: toMinutes(f.inicio),
        fin: toMinutes(f.fin),
      }));

      for (const r of ranges) {
        if (r.inicio >= r.fin) {
          throw new BadRequestException(`Franja inválida en ${key}: inicio >= fin`);
        }
      }

      // Solapamiento
      ranges.sort((a, b) => a.inicio - b.inicio);
      for (let i = 1; i < ranges.length; i++) {
        if (ranges[i].inicio < ranges[i - 1].fin) {
          throw new BadRequestException(`Franjas solapadas en ${key}`);
        }
      }
      totalFranjas += ranges.length;
    }

    if (totalFranjas === 0) {
      throw new BadRequestException('Debes definir al menos una franja horaria en algún día');
    }
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function fromMinutes(min: number): string {
  const h = String(Math.floor(min / 60)).padStart(2, '0');
  const m = String(min % 60).padStart(2, '0');
  return `${h}:${m}`;
}

function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
