import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClinicalEpisode, EstadoEpisodio } from '../clinical-episodes/entities/clinical-episode.entity';
import { Patient } from '../patients/entities/patient.entity';
import { UsersService } from '../users/users.service';
import { RedisService } from '../../common/redis/redis.service';
import { CK, TTL } from '../../common/redis/cache-keys';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { Interconsult, EstadoInterconsulta } from './entities/interconsult.entity';
import { CreateInterconsultDto } from './dto/create-interconsult.dto';
import { UpdateInterconsultDto } from './dto/update-interconsult.dto';
import { RespondInterconsultDto } from './dto/respond-interconsult.dto';
import { InterconsultQueryDto } from './dto/interconsult-query.dto';

const ACTIVE_EPISODE_STATES = [EstadoEpisodio.ABIERTO, EstadoEpisodio.EN_TRATAMIENTO];

@Injectable()
export class InterconsultsService {
  constructor(
    @InjectRepository(Interconsult)
    private readonly repo: Repository<Interconsult>,
    @InjectRepository(ClinicalEpisode)
    private readonly episodeRepo: Repository<ClinicalEpisode>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    private readonly usersService: UsersService,
    private readonly redis: RedisService,
  ) {}

  // ─── Create ──────────────────────────────────────────────────────────────────

  async create(
    patientId: string,
    episodeId: string,
    dto: CreateInterconsultDto,
  ): Promise<Interconsult> {
    const episode = await this.episodeRepo.findOne({
      where: { id: episodeId, pacienteId: patientId },
    });
    if (!episode) throw new NotFoundException(`Episodio ${episodeId} no encontrado`);

    if (!ACTIVE_EPISODE_STATES.includes(episode.estado)) {
      throw new UnprocessableEntityException(
        `Episodio ${episode.estado} — no acepta nuevas interconsultas`,
      );
    }

    if (dto.solicitanteId === dto.destinatarioId) {
      throw new UnprocessableEntityException('solicitanteId y destinatarioId no pueden ser el mismo profesional');
    }

    const ic = this.repo.create({
      episodeId,
      codigoHc: episode.codigoHc,
      pacienteId: patientId,
      solicitanteId: dto.solicitanteId,
      destinatarioId: dto.destinatarioId,
      motivo: dto.motivo,
      hallazgosRelevantes: dto.hallazgosRelevantes ?? null,
      preguntaClinica: dto.preguntaClinica ?? null,
      estado: EstadoInterconsulta.SOLICITADA,
      respuesta: null,
      fechaRespuesta: null,
    });

    return this.repo.save(ic);
  }

  // ─── Find all by episode ─────────────────────────────────────────────────────

  async findAllByEpisode(
    patientId: string,
    episodeId: string,
    query: InterconsultQueryDto,
  ): Promise<PaginatedResponseDto<Interconsult>> {
    await this.assertEpisodeExists(patientId, episodeId);

    const { page, limit, estado, solicitanteId, destinatarioId } = query;
    const qb = this.repo
      .createQueryBuilder('ic')
      .where('ic.episode_id = :episodeId', { episodeId })
      .orderBy('ic.created_at', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (estado) qb.andWhere('ic.estado = :estado', { estado });
    if (solicitanteId) qb.andWhere('ic.solicitante_id = :solicitanteId', { solicitanteId });
    if (destinatarioId) qb.andWhere('ic.destinatario_id = :destinatarioId', { destinatarioId });

    const [data, total] = await qb.getManyAndCount();
    return PaginatedResponseDto.of(data, total, page, limit);
  }

  // ─── Find all global ─────────────────────────────────────────────────────────

  async findAll(
    query: InterconsultQueryDto,
    clerkUserId: string,
    userRole: string,
  ): Promise<PaginatedResponseDto<Interconsult>> {
    const { page, limit, estado, solicitanteId, destinatarioId } = query;

    const qb = this.repo
      .createQueryBuilder('ic')
      .orderBy('ic.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    // Non-admin: only see interconsults where they are solicitante OR destinatario
    if (userRole !== 'admin') {
      const dbUser = await this.usersService.findByExternalId(clerkUserId);
      if (!dbUser) throw new ForbiddenException('Usuario no registrado en sistema');
      qb.andWhere(
        '(ic.solicitante_id = :selfId OR ic.destinatario_id = :selfId)',
        { selfId: dbUser.id },
      );
    } else {
      if (solicitanteId) qb.andWhere('ic.solicitante_id = :solicitanteId', { solicitanteId });
      if (destinatarioId) qb.andWhere('ic.destinatario_id = :destinatarioId', { destinatarioId });
    }

    if (estado) qb.andWhere('ic.estado = :estado', { estado });

    const [data, total] = await qb.getManyAndCount();
    return PaginatedResponseDto.of(data, total, page, limit);
  }

  // ─── Find one ────────────────────────────────────────────────────────────────

  async findOne(patientId: string, episodeId: string, icId: string): Promise<Interconsult> {
    const cached = await this.redis.get<Interconsult>(CK.IC_ID(icId));
    if (cached) return cached;

    await this.assertEpisodeExists(patientId, episodeId);

    const ic = await this.repo.findOne({ where: { id: icId, episodeId } });
    if (!ic) throw new NotFoundException(`Interconsulta ${icId} no encontrada`);

    await this.redis.set(CK.IC_ID(icId), ic, TTL.RECORD);
    return ic;
  }

  // ─── Update (solicitante/admin, solo en SOLICITADA) ──────────────────────────

  async update(
    patientId: string,
    episodeId: string,
    icId: string,
    dto: UpdateInterconsultDto,
    clerkUserId: string,
    userRole: string,
  ): Promise<Interconsult> {
    await this.assertEpisodeExists(patientId, episodeId);

    const ic = await this.repo.findOne({ where: { id: icId, episodeId } });
    if (!ic) throw new NotFoundException(`Interconsulta ${icId} no encontrada`);

    if (ic.estado !== EstadoInterconsulta.SOLICITADA) {
      throw new UnprocessableEntityException(
        `Interconsulta ${ic.estado} — solo se puede editar en estado SOLICITADA`,
      );
    }

    if (userRole !== 'admin') {
      const dbUser = await this.usersService.findByExternalId(clerkUserId);
      if (!dbUser || dbUser.id !== ic.solicitanteId) {
        throw new ForbiddenException('Solo el solicitante o admin puede editar esta interconsulta');
      }
    }

    if (dto.destinatarioId !== undefined) ic.destinatarioId = dto.destinatarioId;
    if (dto.motivo !== undefined) ic.motivo = dto.motivo;
    if (dto.hallazgosRelevantes !== undefined) ic.hallazgosRelevantes = dto.hallazgosRelevantes;
    if (dto.preguntaClinica !== undefined) ic.preguntaClinica = dto.preguntaClinica;

    const saved = await this.repo.save(ic);
    await this.redis.del(CK.IC_ID(icId));
    return saved;
  }

  // ─── Accept (destinatario → EN_PROCESO) ─────────────────────────────────────

  async accept(
    patientId: string,
    episodeId: string,
    icId: string,
    clerkUserId: string,
    userRole: string,
  ): Promise<Interconsult> {
    await this.assertEpisodeExists(patientId, episodeId);

    const ic = await this.repo.findOne({ where: { id: icId, episodeId } });
    if (!ic) throw new NotFoundException(`Interconsulta ${icId} no encontrada`);

    if (ic.estado !== EstadoInterconsulta.SOLICITADA) {
      throw new UnprocessableEntityException(
        `Interconsulta ya en estado ${ic.estado} — no se puede aceptar`,
      );
    }

    await this.assertDestinatarioOrAdmin(ic.destinatarioId, clerkUserId, userRole);

    ic.estado = EstadoInterconsulta.EN_PROCESO;
    const saved = await this.repo.save(ic);
    await this.redis.del(CK.IC_ID(icId));
    return saved;
  }

  // ─── Respond (destinatario → RESPONDIDA) ────────────────────────────────────

  async respond(
    patientId: string,
    episodeId: string,
    icId: string,
    dto: RespondInterconsultDto,
    clerkUserId: string,
    userRole: string,
  ): Promise<Interconsult> {
    await this.assertEpisodeExists(patientId, episodeId);

    const ic = await this.repo.findOne({ where: { id: icId, episodeId } });
    if (!ic) throw new NotFoundException(`Interconsulta ${icId} no encontrada`);

    if (ic.estado === EstadoInterconsulta.RESPONDIDA) {
      throw new UnprocessableEntityException('Interconsulta ya respondida — inmutable');
    }

    await this.assertDestinatarioOrAdmin(ic.destinatarioId, clerkUserId, userRole);

    ic.estado = EstadoInterconsulta.RESPONDIDA;
    ic.respuesta = dto.respuesta;
    ic.fechaRespuesta = new Date();

    const saved = await this.repo.save(ic);
    await this.redis.del(CK.IC_ID(icId));
    return saved;
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async assertEpisodeExists(patientId: string, episodeId: string): Promise<void> {
    const ep = await this.episodeRepo.findOne({
      where: { id: episodeId, pacienteId: patientId },
      select: ['id'],
    });
    if (!ep) throw new NotFoundException(`Episodio ${episodeId} no encontrado`);
  }

  private async assertDestinatarioOrAdmin(
    destinatarioId: string,
    clerkUserId: string,
    userRole: string,
  ): Promise<void> {
    if (userRole === 'admin') return;
    const dbUser = await this.usersService.findByExternalId(clerkUserId);
    if (!dbUser || dbUser.id !== destinatarioId) {
      throw new ForbiddenException('Solo el destinatario o admin puede realizar esta acción');
    }
  }
}
