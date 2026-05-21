import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { ClinicalEpisode, EstadoEpisodio } from '../clinical-episodes/entities/clinical-episode.entity';
import { TreatmentPlan, EstadoPlan } from '../treatment-plans/entities/treatment-plan.entity';
import { Appointment, EstadoCita } from '../appointments/entities/appointment.entity';
import { SoapNote } from '../soap-notes/entities/soap-note.entity';
import { PhysicalEvaluation } from '../physical-evaluations/entities/physical-evaluation.entity';
import { UsersService } from '../users/users.service';
import { RedisService } from '../../common/redis/redis.service';
import { CK, TTL } from '../../common/redis/cache-keys';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { Session, TipoSesion, EstadoSesion } from './entities/session.entity';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { SessionQueryDto } from './dto/session-query.dto';

const ACTIVE_EPISODE_STATES = [EstadoEpisodio.ABIERTO, EstadoEpisodio.EN_TRATAMIENTO];

// Artifact table per tipo
const ARTIFACT_TABLE: Record<TipoSesion, string | null> = {
  [TipoSesion.FISIOTERAPIA]:      'soap_notes',
  [TipoSesion.EVALUACION_FISICA]: 'physical_evaluations',
  [TipoSesion.INTERCONSULTA]:     'interconsults',
  [TipoSesion.CONSULTA_MEDICA]:   null,
};

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private readonly repo: Repository<Session>,
    @InjectRepository(ClinicalEpisode)
    private readonly episodeRepo: Repository<ClinicalEpisode>,
    @InjectRepository(TreatmentPlan)
    private readonly planRepo: Repository<TreatmentPlan>,
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(SoapNote)
    private readonly soapRepo: Repository<SoapNote>,
    @InjectRepository(PhysicalEvaluation)
    private readonly evalRepo: Repository<PhysicalEvaluation>,
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
    private readonly redis: RedisService,
  ) {}

  // ─── Create ──────────────────────────────────────────────────────────────────

  async createSession(
    patientId: string,
    episodeId: string,
    planId: string,
    dto: CreateSessionDto,
  ): Promise<Session> {
    const episode = await this.episodeRepo.findOne({
      where: { id: episodeId, pacienteId: patientId },
    });
    if (!episode) throw new NotFoundException(`Episodio ${episodeId} no encontrado`);
    if (!ACTIVE_EPISODE_STATES.includes(episode.estado)) {
      throw new UnprocessableEntityException(`Episodio ${episode.estado} — no acepta nuevas sesiones`);
    }

    const plan = await this.planRepo.findOne({ where: { id: planId, episodeId } });
    if (!plan) throw new NotFoundException(`Plan ${planId} no encontrado`);
    if (plan.estado !== EstadoPlan.ACTIVO) {
      throw new UnprocessableEntityException(`Plan ${plan.estado} — no acepta nuevas sesiones`);
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaSesion = new Date(dto.fechaSesion);
    fechaSesion.setHours(0, 0, 0, 0);
    if (fechaSesion > hoy) {
      throw new BadRequestException('fechaSesion no puede ser futura');
    }

    if (dto.appointmentId) {
      const appt = await this.appointmentRepo.findOne({
        where: { id: dto.appointmentId, patientId, estado: EstadoCita.CONFIRMADA },
        select: ['id'],
      });
      if (!appt) throw new BadRequestException(`Cita ${dto.appointmentId} no encontrada o no confirmada`);
    }

    return this.dataSource.transaction(async (manager) => {
      const [{ max }] = await manager.query<{ max: number | null }[]>(
        `SELECT MAX(numero_sesion) as max FROM sessions WHERE plan_id = $1`,
        [planId],
      );
      const numeroSesion = (max ?? 0) + 1;

      const session = manager.create(Session, {
        planId,
        episodeId,
        codigoHc: episode.codigoHc,
        pacienteId: patientId,
        profesionalId: dto.profesionalId,
        tipo: dto.tipo,
        estado: EstadoSesion.PROGRAMADA,
        numeroSesion,
        fechaSesion: new Date(dto.fechaSesion),
        appointmentId: dto.appointmentId ?? null,
        observaciones: dto.observaciones ?? null,
      });

      return manager.save(Session, session);
    });
  }

  // ─── createAutoSession — called within AppointmentsService transaction ───────

  async createAutoSession(
    manager: EntityManager,
    data: {
      planId: string;
      episodeId: string;
      codigoHc: string;
      pacienteId: string;
      profesionalId: string;
      appointmentId: string;
      fechaSesion: Date;
    },
  ): Promise<Session> {
    const [{ max }] = await manager.query<{ max: string | null }[]>(
      `SELECT MAX(numero_sesion)::text AS max FROM sessions WHERE plan_id = $1`,
      [data.planId],
    );
    const numeroSesion = (Number(max) || 0) + 1;

    const session = manager.create(Session, {
      planId: data.planId,
      episodeId: data.episodeId,
      codigoHc: data.codigoHc,
      pacienteId: data.pacienteId,
      profesionalId: data.profesionalId,
      tipo: TipoSesion.FISIOTERAPIA,
      estado: EstadoSesion.PROGRAMADA,
      numeroSesion,
      fechaSesion: data.fechaSesion,
      appointmentId: data.appointmentId,
      observaciones: null,
    });

    return manager.save(Session, session);
  }

  // ─── Find all by plan ────────────────────────────────────────────────────────

  async findAllByPlan(
    patientId: string,
    episodeId: string,
    planId: string,
    query: SessionQueryDto,
  ): Promise<PaginatedResponseDto<Session>> {
    await this.assertPlanExists(patientId, episodeId, planId);

    const { page, limit, estado, tipo, profesionalId, desde, hasta } = query;
    const qb = this.repo
      .createQueryBuilder('s')
      .where('s.plan_id = :planId', { planId })
      .orderBy('s.numero_sesion', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (estado)       qb.andWhere('s.estado = :estado', { estado });
    if (tipo)         qb.andWhere('s.tipo = :tipo', { tipo });
    if (profesionalId) qb.andWhere('s.profesional_id = :profesionalId', { profesionalId });
    if (desde)        qb.andWhere('s.fecha_sesion >= :desde', { desde });
    if (hasta)        qb.andWhere('s.fecha_sesion <= :hasta', { hasta });

    const [data, total] = await qb.getManyAndCount();
    return PaginatedResponseDto.of(data, total, page, limit);
  }

  // ─── Find all by episode (cross-plan) ────────────────────────────────────────

  async findAllByEpisode(
    patientId: string,
    episodeId: string,
    query: SessionQueryDto,
  ): Promise<PaginatedResponseDto<Session>> {
    const episode = await this.episodeRepo.findOne({
      where: { id: episodeId, pacienteId: patientId },
      select: ['id'],
    });
    if (!episode) throw new NotFoundException(`Episodio ${episodeId} no encontrado`);

    const { page, limit, estado, tipo, profesionalId, desde, hasta } = query;
    const qb = this.repo
      .createQueryBuilder('s')
      .where('s.episode_id = :episodeId', { episodeId })
      .orderBy('s.numero_sesion', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (estado)       qb.andWhere('s.estado = :estado', { estado });
    if (tipo)         qb.andWhere('s.tipo = :tipo', { tipo });
    if (profesionalId) qb.andWhere('s.profesional_id = :profesionalId', { profesionalId });
    if (desde)        qb.andWhere('s.fecha_sesion >= :desde', { desde });
    if (hasta)        qb.andWhere('s.fecha_sesion <= :hasta', { hasta });

    const [data, total] = await qb.getManyAndCount();
    return PaginatedResponseDto.of(data, total, page, limit);
  }

  // ─── Find one (with artifact) ─────────────────────────────────────────────────

  async findOne(
    patientId: string,
    episodeId: string,
    planId: string,
    sessionId: string,
  ): Promise<Session & { artifact: SoapNote | PhysicalEvaluation | null }> {
    const cached = await this.redis.get<Session>(CK.SESSION_ID(sessionId));
    const session = cached ?? await this.repo.findOne({
      where: { id: sessionId, planId, episodeId },
    });
    if (!session) throw new NotFoundException(`Sesión ${sessionId} no encontrada`);
    if (!cached) await this.redis.set(CK.SESSION_ID(sessionId), session, TTL.LIST);

    let artifact: SoapNote | PhysicalEvaluation | null = null;
    if (session.tipo === TipoSesion.FISIOTERAPIA) {
      artifact = await this.soapRepo.findOne({ where: { sessionId } as any }) ?? null;
    } else if (session.tipo === TipoSesion.EVALUACION_FISICA) {
      artifact = await this.evalRepo.findOne({ where: { sessionId } as any }) ?? null;
    }

    return { ...session, artifact };
  }

  // ─── Update ──────────────────────────────────────────────────────────────────

  async updateSession(
    patientId: string,
    episodeId: string,
    planId: string,
    sessionId: string,
    dto: UpdateSessionDto,
    clerkUserId: string,
    userRole: string,
  ): Promise<Session> {
    await this.assertPlanExists(patientId, episodeId, planId);

    const session = await this.repo.findOne({ where: { id: sessionId, planId, episodeId } });
    if (!session) throw new NotFoundException(`Sesión ${sessionId} no encontrada`);
    if (session.estado === EstadoSesion.COMPLETADA) {
      throw new UnprocessableEntityException('Sesión COMPLETADA — inmutable');
    }

    await this.assertAuthorOrAdmin(session.profesionalId, clerkUserId, userRole);

    if (dto.estado === EstadoSesion.COMPLETADA) {
      if (session.estado !== EstadoSesion.EN_CURSO) {
        throw new UnprocessableEntityException(
          'Solo sesiones EN_CURSO pueden completarse — vincule un artefacto clínico primero',
        );
      }
    }

    if (dto.fechaSesion !== undefined) {
      const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
      const f = new Date(dto.fechaSesion); f.setHours(0, 0, 0, 0);
      if (f > hoy) throw new BadRequestException('fechaSesion no puede ser futura');
      session.fechaSesion = new Date(dto.fechaSesion);
    }
    if (dto.profesionalId !== undefined) session.profesionalId = dto.profesionalId;
    if (dto.estado !== undefined) session.estado = dto.estado;
    if (dto.observaciones !== undefined) session.observaciones = dto.observaciones;

    const saved = await this.repo.save(session);
    await this.redis.del(CK.SESSION_ID(sessionId));

    if (saved.estado === EstadoSesion.COMPLETADA && saved.planId) {
      await this.recalculateProgress(saved.planId);
    }

    return saved;
  }

  // ─── Delete ──────────────────────────────────────────────────────────────────

  async deleteSession(
    patientId: string,
    episodeId: string,
    planId: string,
    sessionId: string,
    userRole: string,
  ): Promise<void> {
    if (userRole !== 'admin') throw new ForbiddenException('Solo admin puede eliminar sesiones');

    await this.assertPlanExists(patientId, episodeId, planId);
    const session = await this.repo.findOne({ where: { id: sessionId, planId, episodeId } });
    if (!session) throw new NotFoundException(`Sesión ${sessionId} no encontrada`);
    if (session.estado !== EstadoSesion.PROGRAMADA) {
      throw new UnprocessableEntityException('Solo sesiones PROGRAMADA pueden eliminarse');
    }

    await this.repo.remove(session);
    await this.redis.del(CK.SESSION_ID(sessionId));
  }

  // ─── Exported: called by artifact services ────────────────────────────────────

  async transitionToEnCurso(sessionId: string, expectedTipo: TipoSesion): Promise<void> {
    const session = await this.repo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException(`Sesión ${sessionId} no encontrada`);
    if (session.tipo !== expectedTipo) {
      throw new UnprocessableEntityException(
        `Sesión tipo ${session.tipo} — artefacto requiere tipo ${expectedTipo}`,
      );
    }
    if (session.estado === EstadoSesion.COMPLETADA || session.estado === EstadoSesion.CANCELADA) {
      throw new UnprocessableEntityException(`Sesión ${session.estado} — no acepta artefactos`);
    }
    if (session.estado === EstadoSesion.EN_CURSO) return; // idempotente

    await this.repo.update(sessionId, { estado: EstadoSesion.EN_CURSO });
    await this.redis.del(CK.SESSION_ID(sessionId));
  }

  // ─── Internal ────────────────────────────────────────────────────────────────

  private async recalculateProgress(planId: string): Promise<void> {
    const plan = await this.planRepo.findOne({
      where: { id: planId },
      select: ['id', 'frecuenciaSemanal', 'duracionEstimadaSemanas'],
    });
    if (!plan?.frecuenciaSemanal || !plan?.duracionEstimadaSemanas) return;

    const sesionesEstimadas = plan.frecuenciaSemanal * plan.duracionEstimadaSemanas;
    const [{ count }] = await this.dataSource.query<{ count: number }[]>(
      `SELECT COUNT(*)::int AS count FROM sessions WHERE plan_id = $1 AND estado = 'COMPLETADA'`,
      [planId],
    );
    const progreso = Math.min(100, Math.round((count / sesionesEstimadas) * 10000) / 100);
    await this.planRepo.update(planId, { progresoPorcentaje: progreso });
    await this.redis.del(CK.PLAN_ID(planId));
  }

  private async assertPlanExists(patientId: string, episodeId: string, planId: string): Promise<void> {
    const plan = await this.planRepo.findOne({
      where: { id: planId, episodeId, pacienteId: patientId },
      select: ['id'],
    });
    if (!plan) throw new NotFoundException(`Plan ${planId} no encontrado`);
  }

  private async assertAuthorOrAdmin(
    authorId: string,
    clerkUserId: string,
    userRole: string,
  ): Promise<void> {
    if (userRole === 'admin') return;
    const dbUser = await this.usersService.findByExternalId(clerkUserId);
    if (!dbUser || dbUser.id !== authorId) {
      throw new ForbiddenException('Solo el autor o admin puede modificar esta sesión');
    }
  }
}
