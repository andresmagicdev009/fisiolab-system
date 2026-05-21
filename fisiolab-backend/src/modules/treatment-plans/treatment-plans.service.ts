import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ClinicalEpisode, EstadoEpisodio } from '../clinical-episodes/entities/clinical-episode.entity';
import { Patient } from '../patients/entities/patient.entity';
import { UsersService } from '../users/users.service';
import { RedisService } from '../../common/redis/redis.service';
import { CK } from '../../common/redis/cache-keys';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { TreatmentPlan, EstadoPlan } from './entities/treatment-plan.entity';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { PlanQueryDto } from './dto/plan-query.dto';

const ACTIVE_EPISODE_STATES = [EstadoEpisodio.ABIERTO, EstadoEpisodio.EN_TRATAMIENTO];

@Injectable()
export class TreatmentPlansService {
  constructor(
    @InjectRepository(TreatmentPlan)
    private readonly planRepo: Repository<TreatmentPlan>,
    @InjectRepository(ClinicalEpisode)
    private readonly episodeRepo: Repository<ClinicalEpisode>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
    private readonly redis: RedisService,
  ) {}

  async createPlan(
    patientId: string,
    episodeId: string,
    dto: CreatePlanDto,
  ): Promise<TreatmentPlan> {
    const episode = await this.getActiveEpisode(patientId, episodeId);

    return this.dataSource.transaction(async (manager) => {
      const result = await manager.query<{ max: number | null }[]>(
        `SELECT MAX(numero_plan) as max FROM treatment_plans WHERE episode_id = $1`,
        [episodeId],
      );
      const numeroPlan = (result[0]?.max ?? 0) + 1;

      const plan = manager.create(TreatmentPlan, {
        episodeId,
        codigoHc: episode.codigoHc,
        pacienteId: patientId,
        profesionalId: dto.profesionalId,
        numeroPlan,
        estado: EstadoPlan.ACTIVO,
        objetivoTerapeutico: dto.objetivoTerapeutico,
        duracionEstimadaSemanas: dto.duracionEstimadaSemanas ?? null,
        frecuenciaSemanal: dto.frecuenciaSemanal ?? null,
        fechaInicio: dto.fechaInicio ? new Date(dto.fechaInicio) : null,
        fechaFin: dto.fechaFin ? new Date(dto.fechaFin) : null,
        appointmentId: dto.appointmentId ?? null,
        progresoPorcentaje: 0,
        observaciones: dto.observaciones ?? null,
        exercises: [],
      });

      return manager.save(TreatmentPlan, plan);
    });
  }

  async findAllPlans(
    patientId: string,
    episodeId: string,
    query: PlanQueryDto,
  ): Promise<PaginatedResponseDto<TreatmentPlan>> {
    await this.assertEpisodeExists(patientId, episodeId);

    const { page, limit, estado, profesionalId } = query;
    const qb = this.planRepo
      .createQueryBuilder('p')
      .where('p.episode_id = :episodeId', { episodeId })
      .orderBy('p.numero_plan', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (estado) qb.andWhere('p.estado = :estado', { estado });
    if (profesionalId) qb.andWhere('p.profesional_id = :profesionalId', { profesionalId });

    const [data, total] = await qb.getManyAndCount();

    data.forEach((p) => { p.exercises = []; });

    return PaginatedResponseDto.of(data, total, page, limit);
  }

  async findOnePlan(
    patientId: string,
    episodeId: string,
    planId: string,
  ): Promise<TreatmentPlan & { sesionesEstimadas: number | null; sesionesCompletadas: number }> {
    await this.assertEpisodeExists(patientId, episodeId);

    const plan = await this.planRepo.findOne({
      where: { id: planId, episodeId },
      relations: ['exercises'],
      order: { exercises: { orden: 'ASC' } },
    });
    if (!plan) throw new NotFoundException(`Plan ${planId} no encontrado`);

    const [{ count }] = await this.dataSource.query<{ count: number }[]>(
      `SELECT COUNT(*)::int AS count FROM sessions WHERE plan_id = $1 AND estado = 'COMPLETADA'`,
      [planId],
    );

    const sesionesEstimadas =
      plan.frecuenciaSemanal && plan.duracionEstimadaSemanas
        ? plan.frecuenciaSemanal * plan.duracionEstimadaSemanas
        : null;

    return { ...plan, sesionesEstimadas, sesionesCompletadas: count };
  }

  async updatePlan(
    patientId: string,
    episodeId: string,
    planId: string,
    dto: UpdatePlanDto,
    clerkUserId: string,
    userRole: string,
  ): Promise<TreatmentPlan> {
    await this.getActiveEpisode(patientId, episodeId);

    const plan = await this.planRepo.findOne({ where: { id: planId, episodeId } });
    if (!plan) throw new NotFoundException(`Plan ${planId} no encontrado`);

    if (plan.estado !== EstadoPlan.ACTIVO) {
      throw new UnprocessableEntityException(`Plan ${plan.estado} — inmutable`);
    }

    await this.assertAuthorOrAdmin(plan.profesionalId, clerkUserId, userRole);

    if (dto.profesionalId !== undefined) plan.profesionalId = dto.profesionalId;
    if (dto.objetivoTerapeutico !== undefined) plan.objetivoTerapeutico = dto.objetivoTerapeutico;
    if (dto.duracionEstimadaSemanas !== undefined) plan.duracionEstimadaSemanas = dto.duracionEstimadaSemanas;
    if (dto.frecuenciaSemanal !== undefined) plan.frecuenciaSemanal = dto.frecuenciaSemanal;
    if (dto.fechaInicio !== undefined) plan.fechaInicio = new Date(dto.fechaInicio);
    if (dto.fechaFin !== undefined) plan.fechaFin = new Date(dto.fechaFin);
    if (dto.appointmentId !== undefined) plan.appointmentId = dto.appointmentId;
    if (dto.progresoPorcentaje !== undefined) plan.progresoPorcentaje = dto.progresoPorcentaje;
    if (dto.estado !== undefined) plan.estado = dto.estado;
    if (dto.observaciones !== undefined) plan.observaciones = dto.observaciones;

    const saved = await this.planRepo.save(plan);
    await this.redis.del(CK.PLAN_ID(planId));
    return saved;
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async getActiveEpisode(patientId: string, episodeId: string): Promise<ClinicalEpisode> {
    const episode = await this.episodeRepo.findOne({
      where: { id: episodeId, pacienteId: patientId },
    });
    if (!episode) throw new NotFoundException(`Episodio ${episodeId} no encontrado`);
    if (!ACTIVE_EPISODE_STATES.includes(episode.estado)) {
      throw new UnprocessableEntityException(
        `Episodio ${episode.estado} — no acepta modificaciones`,
      );
    }
    return episode;
  }

  private async assertEpisodeExists(patientId: string, episodeId: string): Promise<void> {
    const ep = await this.episodeRepo.findOne({
      where: { id: episodeId, pacienteId: patientId },
      select: ['id'],
    });
    if (!ep) throw new NotFoundException(`Episodio ${episodeId} no encontrado`);
  }

  private async assertAuthorOrAdmin(
    authorId: string,
    clerkUserId: string,
    userRole: string,
  ): Promise<void> {
    if (userRole === 'admin') return;
    const dbUser = await this.usersService.findByExternalId(clerkUserId);
    if (!dbUser || dbUser.id !== authorId) {
      throw new ForbiddenException('Solo el autor o admin puede modificar este recurso');
    }
  }
}
