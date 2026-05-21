import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../patients/entities/patient.entity';
import { TarjeteroIndice, EstadoTarjetero } from '../tarjetero-indice/entities/tarjetero-indice.entity';
import { RedisService } from '../../common/redis/redis.service';
import { CK, TTL } from '../../common/redis/cache-keys';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { ClinicalEpisode, EstadoEpisodio } from './entities/clinical-episode.entity';
import { CreateEpisodeDto } from './dto/create-episode.dto';
import { UpdateEpisodeDto } from './dto/update-episode.dto';
import { CloseEpisodeDto } from './dto/close-episode.dto';
import { EpisodeQueryDto } from './dto/episode-query.dto';

const ACTIVE_STATES = [EstadoEpisodio.ABIERTO, EstadoEpisodio.EN_TRATAMIENTO];

@Injectable()
export class ClinicalEpisodesService {
  constructor(
    @InjectRepository(ClinicalEpisode)
    private readonly repo: Repository<ClinicalEpisode>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(TarjeteroIndice)
    private readonly tarjeteroRepo: Repository<TarjeteroIndice>,
    private readonly redis: RedisService,
  ) {}

  // ─── Create ──────────────────────────────────────────────────────────────────

  async create(patientId: string, dto: CreateEpisodeDto): Promise<ClinicalEpisode> {
    const patient = await this.patientRepo.findOne({
      where: { id: patientId },
      select: ['id', 'nombres', 'apellidos', 'cedula', 'genero'],
    });
    if (!patient) throw new NotFoundException(`Paciente ${patientId} no encontrado`);

    const tarjetero = await this.tarjeteroRepo.findOne({ where: { pacienteId: patientId } });
    if (!tarjetero) throw new NotFoundException(`Paciente ${patientId} no tiene tarjetero índice`);
    if (tarjetero.estado !== EstadoTarjetero.ACTIVO) {
      throw new UnprocessableEntityException(
        `Tarjetero del paciente está ${tarjetero.estado} — no se puede abrir episodio`,
      );
    }

    const episode = this.repo.create({
      tarjeteroId: tarjetero.id,
      codigoHc: tarjetero.codigoHc,
      pacienteId: patientId,
      profesionalId: dto.profesionalId,
      estado: EstadoEpisodio.ABIERTO,
      motivoConsulta: dto.motivoConsulta,
      notaApertura: dto.notaApertura ?? null,
      appointmentId: dto.appointmentId ?? null,
      fechaApertura: new Date(),
      fechaCierre: null,
    });

    const saved = await this.repo.save(episode);
    return this.repo.findOne({ where: { id: saved.id }, relations: ['paciente'] }) as Promise<ClinicalEpisode>;
  }

  // ─── Find all by patient ─────────────────────────────────────────────────────

  async findAllByPatient(
    patientId: string,
    query: EpisodeQueryDto,
  ): Promise<PaginatedResponseDto<ClinicalEpisode>> {
    const patient = await this.patientRepo.findOne({ where: { id: patientId }, select: ['id'] });
    if (!patient) throw new NotFoundException(`Paciente ${patientId} no encontrado`);

    const { page, limit, estado } = query;
    const qb = this.repo
      .createQueryBuilder('e')
      .where('e.patient_id = :patientId', { patientId })
      .orderBy('e.fecha_apertura', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (estado) qb.andWhere('e.estado = :estado', { estado });

    const [data, total] = await qb.getManyAndCount();
    return PaginatedResponseDto.of(data, total, page, limit);
  }

  // ─── Find one ────────────────────────────────────────────────────────────────

  async findOne(patientId: string, episodeId: string): Promise<ClinicalEpisode> {
    const cached = await this.redis.get<ClinicalEpisode>(CK.EPISODE_ID(episodeId));
    if (cached) return cached;

    const episode = await this.repo.findOne({
      where: { id: episodeId, pacienteId: patientId },
      relations: ['paciente'],
    });
    if (!episode) throw new NotFoundException(`Episodio ${episodeId} no encontrado`);

    await this.redis.set(CK.EPISODE_ID(episodeId), episode, TTL.LIST);
    return episode;
  }

  // ─── Update ──────────────────────────────────────────────────────────────────

  async update(
    patientId: string,
    episodeId: string,
    dto: UpdateEpisodeDto,
    userRole: string,
  ): Promise<ClinicalEpisode> {
    const episode = await this.repo.findOne({
      where: { id: episodeId, pacienteId: patientId },
      relations: ['paciente'],
    });
    if (!episode) throw new NotFoundException(`Episodio ${episodeId} no encontrado`);

    if (!ACTIVE_STATES.includes(episode.estado) && dto.estado !== EstadoEpisodio.ARCHIVADO) {
      throw new UnprocessableEntityException(`Episodio ${episode.estado} — solo se puede archivar`);
    }

    if (dto.estado) {
      this.assertStateTransition(episode.estado, dto.estado, userRole);
    }

    if (dto.motivoConsulta !== undefined) episode.motivoConsulta = dto.motivoConsulta;
    if (dto.profesionalId !== undefined) episode.profesionalId = dto.profesionalId;
    if (dto.diagnosticoPrincipal !== undefined) episode.diagnosticoPrincipal = dto.diagnosticoPrincipal;
    if (dto.codigoCie10 !== undefined) episode.codigoCie10 = dto.codigoCie10;
    if (dto.diagnosticoSecundario !== undefined) episode.diagnosticoSecundario = dto.diagnosticoSecundario;
    if (dto.notaApertura !== undefined) episode.notaApertura = dto.notaApertura;
    if (dto.estado !== undefined) episode.estado = dto.estado;

    const saved = await this.repo.save(episode);
    await this.redis.del(CK.EPISODE_ID(episodeId));
    return saved;
  }

  // ─── Close ───────────────────────────────────────────────────────────────────

  async close(
    patientId: string,
    episodeId: string,
    dto: CloseEpisodeDto,
  ): Promise<ClinicalEpisode> {
    const episode = await this.repo.findOne({
      where: { id: episodeId, pacienteId: patientId },
      relations: ['paciente'],
    });
    if (!episode) throw new NotFoundException(`Episodio ${episodeId} no encontrado`);

    if (!ACTIVE_STATES.includes(episode.estado)) {
      throw new UnprocessableEntityException(
        `Episodio ya está ${episode.estado} — no se puede cerrar`,
      );
    }

    episode.estado = EstadoEpisodio.CERRADO;
    episode.notaCierre = dto.notaCierre;
    episode.fechaCierre = new Date();
    if (dto.diagnosticoPrincipal !== undefined) episode.diagnosticoPrincipal = dto.diagnosticoPrincipal;
    if (dto.codigoCie10 !== undefined) episode.codigoCie10 = dto.codigoCie10;

    const saved = await this.repo.save(episode);
    await this.redis.del(CK.EPISODE_ID(episodeId));
    return saved;
  }

  // ─── Find all global ─────────────────────────────────────────────────────────

  async findAll(query: EpisodeQueryDto): Promise<PaginatedResponseDto<ClinicalEpisode>> {
    const { page, limit, estado, profesionalId, search, desde, hasta } = query;

    const qb = this.repo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.paciente', 'p')
      .orderBy('e.fecha_apertura', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (estado) qb.andWhere('e.estado = :estado', { estado });
    if (profesionalId) qb.andWhere('e.profesional_id = :profesionalId', { profesionalId });
    if (search) {
      qb.andWhere(
        '(LOWER(e.motivo_consulta) ILIKE :s OR LOWER(e.diagnostico_principal) ILIKE :s)',
        { s: `%${search.toLowerCase()}%` },
      );
    }
    if (desde) qb.andWhere('e.fecha_apertura >= :desde', { desde });
    if (hasta) qb.andWhere('e.fecha_apertura <= :hasta', { hasta });

    const [data, total] = await qb.getManyAndCount();
    return PaginatedResponseDto.of(data, total, page, limit);
  }

  // ─── State machine guard ─────────────────────────────────────────────────────

  private assertStateTransition(
    current: EstadoEpisodio,
    next: EstadoEpisodio,
    role: string,
  ): void {
    const allowed: Partial<Record<EstadoEpisodio, EstadoEpisodio[]>> = {
      [EstadoEpisodio.ABIERTO]: [EstadoEpisodio.EN_TRATAMIENTO],
      [EstadoEpisodio.EN_TRATAMIENTO]: [EstadoEpisodio.ABIERTO],
      [EstadoEpisodio.CERRADO]: [EstadoEpisodio.ARCHIVADO],
    };

    if (!allowed[current]?.includes(next)) {
      throw new ForbiddenException(`Transición ${current} → ${next} no permitida`);
    }

    if (next === EstadoEpisodio.ARCHIVADO && role !== 'admin') {
      throw new ForbiddenException('Solo admin puede archivar un episodio');
    }
  }
}
