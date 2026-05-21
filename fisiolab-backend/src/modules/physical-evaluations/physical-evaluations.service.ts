import {
  BadRequestException,
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
import { CK, TTL } from '../../common/redis/cache-keys';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { PhysicalEvaluation } from './entities/physical-evaluation.entity';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';
import { EvaluationQueryDto } from './dto/evaluation-query.dto';

const ACTIVE_STATES = [EstadoEpisodio.ABIERTO, EstadoEpisodio.EN_TRATAMIENTO];

@Injectable()
export class PhysicalEvaluationsService {
  constructor(
    @InjectRepository(PhysicalEvaluation)
    private readonly repo: Repository<PhysicalEvaluation>,
    @InjectRepository(ClinicalEpisode)
    private readonly episodeRepo: Repository<ClinicalEpisode>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
    private readonly redis: RedisService,
  ) {}

  // ─── Create ──────────────────────────────────────────────────────────────────

  async create(
    patientId: string,
    episodeId: string,
    dto: CreateEvaluationDto,
  ): Promise<PhysicalEvaluation> {
    const episode = await this.episodeRepo.findOne({
      where: { id: episodeId, pacienteId: patientId },
    });
    if (!episode) throw new NotFoundException(`Episodio ${episodeId} no encontrado`);

    if (!ACTIVE_STATES.includes(episode.estado)) {
      throw new UnprocessableEntityException(
        `Episodio ${episode.estado} — no acepta nuevas evaluaciones`,
      );
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaEval = new Date(dto.fechaEvaluacion);
    fechaEval.setHours(0, 0, 0, 0);
    if (fechaEval > hoy) {
      throw new BadRequestException('fechaEvaluacion no puede ser futura');
    }

    return this.dataSource.transaction(async (manager) => {
      const result = await manager.query<{ max: number | null }[]>(
        `SELECT MAX(numero_evaluacion) as max FROM physical_evaluations WHERE episode_id = $1`,
        [episodeId],
      );
      const numeroEvaluacion = (result[0]?.max ?? 0) + 1;

      const entity = manager.create(PhysicalEvaluation, {
        episodeId,
        codigoHc: episode.codigoHc,
        pacienteId: patientId,
        profesionalId: dto.profesionalId,
        numeroEvaluacion,
        fechaEvaluacion: new Date(dto.fechaEvaluacion),
        rangoMovimiento: dto.rangoMovimiento ?? null,
        fuerzaMuscular: dto.fuerzaMuscular ?? null,
        escalaDolor: dto.escalaDolor ?? null,
        pruebasEspecificas: dto.pruebasEspecificas ?? null,
        inspeccion: dto.inspeccion ?? null,
        palpacion: dto.palpacion ?? null,
        diagnostico: dto.diagnostico ?? null,
        observaciones: dto.observaciones ?? null,
      });

      return manager.save(PhysicalEvaluation, entity);
    });
  }

  // ─── Find all by episode ─────────────────────────────────────────────────────

  async findAllByEpisode(
    patientId: string,
    episodeId: string,
    query: EvaluationQueryDto,
  ): Promise<PaginatedResponseDto<PhysicalEvaluation>> {
    await this.assertEpisodeExists(patientId, episodeId);

    const { page, limit, profesionalId, desde, hasta } = query;
    const qb = this.repo
      .createQueryBuilder('e')
      .where('e.episode_id = :episodeId', { episodeId })
      .orderBy('e.numero_evaluacion', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (profesionalId) qb.andWhere('e.profesional_id = :profesionalId', { profesionalId });
    if (desde) qb.andWhere('e.fecha_evaluacion >= :desde', { desde });
    if (hasta) qb.andWhere('e.fecha_evaluacion <= :hasta', { hasta });

    const [data, total] = await qb.getManyAndCount();
    return PaginatedResponseDto.of(data, total, page, limit);
  }

  // ─── Find one ────────────────────────────────────────────────────────────────

  async findOne(
    patientId: string,
    episodeId: string,
    evalId: string,
  ): Promise<PhysicalEvaluation> {
    const cached = await this.redis.get<PhysicalEvaluation>(CK.EVAL_ID(evalId));
    if (cached) return cached;

    await this.assertEpisodeExists(patientId, episodeId);

    const evaluation = await this.repo.findOne({ where: { id: evalId, episodeId } });
    if (!evaluation) throw new NotFoundException(`Evaluación ${evalId} no encontrada`);

    await this.redis.set(CK.EVAL_ID(evalId), evaluation, TTL.RECORD);
    return evaluation;
  }

  // ─── Update ──────────────────────────────────────────────────────────────────

  async update(
    patientId: string,
    episodeId: string,
    evalId: string,
    dto: UpdateEvaluationDto,
    clerkUserId: string,
    userRole: string,
  ): Promise<PhysicalEvaluation> {
    const episode = await this.episodeRepo.findOne({
      where: { id: episodeId, pacienteId: patientId },
    });
    if (!episode) throw new NotFoundException(`Episodio ${episodeId} no encontrado`);

    if (!ACTIVE_STATES.includes(episode.estado)) {
      throw new UnprocessableEntityException(
        `Episodio ${episode.estado} — evaluaciones inmutables`,
      );
    }

    const evaluation = await this.repo.findOne({ where: { id: evalId, episodeId } });
    if (!evaluation) throw new NotFoundException(`Evaluación ${evalId} no encontrada`);

    if (userRole !== 'admin') {
      const dbUser = await this.usersService.findByExternalId(clerkUserId);
      if (!dbUser || dbUser.id !== evaluation.profesionalId) {
        throw new ForbiddenException('Solo el autor o admin puede editar esta evaluación');
      }
    }

    if (dto.fechaEvaluacion !== undefined) evaluation.fechaEvaluacion = new Date(dto.fechaEvaluacion);
    if (dto.profesionalId !== undefined) evaluation.profesionalId = dto.profesionalId;
    if (dto.rangoMovimiento !== undefined) {
      evaluation.rangoMovimiento = { ...(evaluation.rangoMovimiento ?? {}), ...dto.rangoMovimiento };
    }
    if (dto.fuerzaMuscular !== undefined) {
      evaluation.fuerzaMuscular = { ...(evaluation.fuerzaMuscular ?? {}), ...dto.fuerzaMuscular };
    }
    if (dto.escalaDolor !== undefined) evaluation.escalaDolor = dto.escalaDolor;
    if (dto.pruebasEspecificas !== undefined) {
      evaluation.pruebasEspecificas = { ...(evaluation.pruebasEspecificas ?? {}), ...dto.pruebasEspecificas };
    }
    if (dto.inspeccion !== undefined) evaluation.inspeccion = dto.inspeccion;
    if (dto.palpacion !== undefined) evaluation.palpacion = dto.palpacion;
    if (dto.diagnostico !== undefined) evaluation.diagnostico = dto.diagnostico;
    if (dto.observaciones !== undefined) evaluation.observaciones = dto.observaciones;

    const saved = await this.repo.save(evaluation);
    await this.redis.del(CK.EVAL_ID(evalId));
    return saved;
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async assertEpisodeExists(patientId: string, episodeId: string): Promise<void> {
    const episode = await this.episodeRepo.findOne({
      where: { id: episodeId, pacienteId: patientId },
      select: ['id'],
    });
    if (!episode) throw new NotFoundException(`Episodio ${episodeId} no encontrado`);
  }
}
