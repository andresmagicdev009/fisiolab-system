import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ClinicalEpisode, EstadoEpisodio } from '../clinical-episodes/entities/clinical-episode.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Session, EstadoSesion, TipoSesion } from '../sessions/entities/session.entity';
import { UsersService } from '../users/users.service';
import { SessionsService } from '../sessions/sessions.service';
import { RedisService } from '../../common/redis/redis.service';
import { CK, TTL } from '../../common/redis/cache-keys';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { SoapNote } from './entities/soap-note.entity';
import { CreateSoapNoteDto } from './dto/create-soap-note.dto';
import { UpdateSoapNoteDto } from './dto/update-soap-note.dto';
import { SoapQueryDto } from './dto/soap-query.dto';

const ACTIVE_STATES = [EstadoEpisodio.ABIERTO, EstadoEpisodio.EN_TRATAMIENTO];

@Injectable()
export class SoapNotesService {
  constructor(
    @InjectRepository(SoapNote)
    private readonly repo: Repository<SoapNote>,
    @InjectRepository(ClinicalEpisode)
    private readonly episodeRepo: Repository<ClinicalEpisode>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly redis: RedisService,
  ) {}

  // ─── Create ──────────────────────────────────────────────────────────────────

  async create(
    patientId: string,
    episodeId: string,
    dto: CreateSoapNoteDto,
  ): Promise<SoapNote> {
    const episode = await this.episodeRepo.findOne({
      where: { id: episodeId, pacienteId: patientId },
    });
    if (!episode) throw new NotFoundException(`Episodio ${episodeId} no encontrado`);

    if (!ACTIVE_STATES.includes(episode.estado)) {
      throw new UnprocessableEntityException(
        `Episodio ${episode.estado} — no acepta nuevas notas SOAP`,
      );
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaSesion = new Date(dto.fechaSesion);
    fechaSesion.setHours(0, 0, 0, 0);
    if (fechaSesion > hoy) {
      throw new BadRequestException('fechaSesion no puede ser futura');
    }

    // Validate session link if provided
    if (dto.sessionId) {
      const session = await this.sessionRepo.findOne({
        where: { id: dto.sessionId, episodeId },
      });
      if (!session) throw new NotFoundException(`Sesión ${dto.sessionId} no encontrada en este episodio`);
      if (session.tipo !== TipoSesion.FISIOTERAPIA) {
        throw new UnprocessableEntityException(`Sesión tipo ${session.tipo} — solo sesiones FISIOTERAPIA aceptan nota SOAP`);
      }
      if (session.estado === EstadoSesion.COMPLETADA || session.estado === EstadoSesion.CANCELADA) {
        throw new UnprocessableEntityException(`Sesión ${session.estado} — no acepta nuevos artefactos`);
      }
      const existing = await this.repo.findOne({ where: { sessionId: dto.sessionId } });
      if (existing) throw new ConflictException(`Sesión ${dto.sessionId} ya tiene una nota SOAP vinculada`);
    }

    const note = await this.dataSource.transaction(async (manager) => {
      const result = await manager.query<{ max: number | null }[]>(
        `SELECT MAX(numero_sesion) as max FROM soap_notes WHERE episode_id = $1`,
        [episodeId],
      );
      const numeroSesion = (result[0]?.max ?? 0) + 1;

      const entity = manager.create(SoapNote, {
        sessionId: dto.sessionId ?? null,
        episodeId,
        codigoHc: episode.codigoHc,
        pacienteId: patientId,
        profesionalId: dto.profesionalId,
        numeroSesion,
        fechaSesion: new Date(dto.fechaSesion),
        subjetivo: dto.subjetivo,
        objetivo: dto.objetivo,
        analisis: dto.analisis ?? {},
        plan: dto.plan ?? {},
        observaciones: dto.observaciones ?? null,
      });

      return manager.save(SoapNote, entity);
    });

    // Auto-transition session to EN_CURSO after note is persisted
    if (dto.sessionId) {
      await this.sessionsService.transitionToEnCurso(dto.sessionId, TipoSesion.FISIOTERAPIA);
    }

    if (episode.estado === EstadoEpisodio.ABIERTO) {
      await this.episodeRepo.update(episodeId, { estado: EstadoEpisodio.EN_TRATAMIENTO });
      await this.redis.del(CK.EPISODE_ID(episodeId));
    }

    return note;
  }

  // ─── Find all by episode ─────────────────────────────────────────────────────

  async findAllByEpisode(
    patientId: string,
    episodeId: string,
    query: SoapQueryDto,
  ): Promise<PaginatedResponseDto<SoapNote>> {
    await this.assertEpisodeExists(patientId, episodeId);

    const { page, limit, profesionalId, desde, hasta } = query;
    const qb = this.repo
      .createQueryBuilder('s')
      .where('s.episode_id = :episodeId', { episodeId })
      .orderBy('s.numero_sesion', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (profesionalId) qb.andWhere('s.profesional_id = :profesionalId', { profesionalId });
    if (desde) qb.andWhere('s.fecha_sesion >= :desde', { desde });
    if (hasta) qb.andWhere('s.fecha_sesion <= :hasta', { hasta });

    const [data, total] = await qb.getManyAndCount();
    return PaginatedResponseDto.of(data, total, page, limit);
  }

  // ─── Find one ────────────────────────────────────────────────────────────────

  async findOne(patientId: string, episodeId: string, soapId: string): Promise<SoapNote> {
    const cached = await this.redis.get<SoapNote>(CK.SOAP_ID(soapId));
    if (cached) return cached;

    await this.assertEpisodeExists(patientId, episodeId);

    const note = await this.repo.findOne({ where: { id: soapId, episodeId } });
    if (!note) throw new NotFoundException(`Nota SOAP ${soapId} no encontrada`);

    await this.redis.set(CK.SOAP_ID(soapId), note, TTL.LIST);
    return note;
  }

  // ─── Update ──────────────────────────────────────────────────────────────────

  async update(
    patientId: string,
    episodeId: string,
    soapId: string,
    dto: UpdateSoapNoteDto,
    clerkUserId: string,
    userRole: string,
  ): Promise<SoapNote> {
    const episode = await this.episodeRepo.findOne({ where: { id: episodeId, pacienteId: patientId } });
    if (!episode) throw new NotFoundException(`Episodio ${episodeId} no encontrado`);

    if (!ACTIVE_STATES.includes(episode.estado)) {
      throw new UnprocessableEntityException(`Episodio ${episode.estado} — notas inmutables`);
    }

    const note = await this.repo.findOne({ where: { id: soapId, episodeId } });
    if (!note) throw new NotFoundException(`Nota SOAP ${soapId} no encontrada`);

    if (userRole !== 'admin') {
      const dbUser = await this.usersService.findByExternalId(clerkUserId);
      if (!dbUser || dbUser.id !== note.profesionalId) {
        throw new ForbiddenException('Solo el autor o admin puede editar esta nota SOAP');
      }
    }

    if (dto.fechaSesion !== undefined) note.fechaSesion = new Date(dto.fechaSesion);
    if (dto.profesionalId !== undefined) note.profesionalId = dto.profesionalId;
    if (dto.subjetivo !== undefined) note.subjetivo = { ...note.subjetivo, ...dto.subjetivo };
    if (dto.objetivo !== undefined) note.objetivo = { ...note.objetivo, ...dto.objetivo };
    if (dto.analisis !== undefined) note.analisis = { ...note.analisis, ...dto.analisis };
    if (dto.plan !== undefined) note.plan = { ...note.plan, ...dto.plan };
    if (dto.observaciones !== undefined) note.observaciones = dto.observaciones;

    const saved = await this.repo.save(note);
    await this.redis.del(CK.SOAP_ID(soapId));
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
