import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Patient } from '../patients/entities/patient.entity';
import { RedisService } from '../../common/redis/redis.service';
import { CK, TTL } from '../../common/redis/cache-keys';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { EstadoTarjetero, TarjeteroIndice } from './entities/tarjetero-indice.entity';
import { CreateTarjeteroDto } from './dto/create-tarjetero.dto';
import { UpdateTarjeteroDto } from './dto/update-tarjetero.dto';
import { TarjeteroQueryDto } from './dto/tarjetero-query.dto';

@Injectable()
export class TarjeteroIndiceService {
  constructor(
    @InjectRepository(TarjeteroIndice)
    private readonly repo: Repository<TarjeteroIndice>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    private readonly dataSource: DataSource,
    private readonly redis: RedisService,
  ) {}

  // ─── Create ──────────────────────────────────────────────────────────────────

  async create(patientId: string, dto: CreateTarjeteroDto): Promise<TarjeteroIndice> {
    const patient = await this.patientRepo.findOne({
      where: { id: patientId },
      select: ['id', 'nombres', 'apellidos', 'cedula', 'genero'],
    });
    if (!patient) throw new NotFoundException(`Paciente ${patientId} no encontrado`);

    const existing = await this.repo.findOne({ where: { pacienteId: patientId } });
    if (existing) throw new ConflictException(`Paciente ${patientId} ya tiene un tarjetero (${existing.codigoHc})`);

    const tarjetero = await this.dataSource.transaction(async (manager) => {
      const anio = new Date().getFullYear();

      const result = await manager.query<{ max: number | null }[]>(
        `SELECT MAX(numero_secuencia) as max FROM tarjetero_indice WHERE anio_secuencia = $1`,
        [anio],
      );
      const siguiente = (result[0]?.max ?? 0) + 1;
      const codigoHc = `HC-${anio}-${String(siguiente).padStart(4, '0')}`;

      const entity = manager.create(TarjeteroIndice, {
        codigoHc,
        pacienteId: patientId,
        medicoResponsableId: dto.medicoResponsableId ?? null,
        estado: EstadoTarjetero.ACTIVO,
        observaciones: dto.observaciones ?? null,
        fechaApertura: new Date(),
        anioSecuencia: anio,
        numeroSecuencia: siguiente,
      });

      return manager.save(TarjeteroIndice, entity);
    });

    const withPatient = await this.repo.findOne({
      where: { id: tarjetero.id },
      relations: ['paciente'],
    });

    await this.redis.del(CK.TARJETERO_LIST);
    return withPatient!;
  }

  // ─── Find by patient ─────────────────────────────────────────────────────────

  async findByPatient(patientId: string): Promise<TarjeteroIndice> {
    const patient = await this.patientRepo.findOne({ where: { id: patientId }, select: ['id'] });
    if (!patient) throw new NotFoundException(`Paciente ${patientId} no encontrado`);

    const cached = await this.redis.get<TarjeteroIndice>(CK.TARJETERO_PATIENT(patientId));
    if (cached) return cached;

    const tarjetero = await this.repo.findOne({
      where: { pacienteId: patientId },
      relations: ['paciente'],
    });
    if (!tarjetero) throw new NotFoundException(`Paciente ${patientId} no tiene tarjetero`);

    await this.redis.set(CK.TARJETERO_PATIENT(patientId), tarjetero, TTL.RECORD);
    return tarjetero;
  }

  // ─── Find by código HC ───────────────────────────────────────────────────────

  async findByCodigo(codigoHc: string): Promise<TarjeteroIndice> {
    const cached = await this.redis.get<TarjeteroIndice>(CK.TARJETERO_CODIGO(codigoHc));
    if (cached) return cached;

    const tarjetero = await this.repo.findOne({
      where: { codigoHc },
      relations: ['paciente'],
    });
    if (!tarjetero) throw new NotFoundException(`Código HC ${codigoHc} no encontrado`);

    await this.redis.set(CK.TARJETERO_CODIGO(codigoHc), tarjetero, TTL.RECORD);
    return tarjetero;
  }

  // ─── List ────────────────────────────────────────────────────────────────────

  async findAll(query: TarjeteroQueryDto): Promise<PaginatedResponseDto<TarjeteroIndice>> {
    const { page, limit, search, codigoHc, estado, anio } = query;

    const qb = this.repo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.paciente', 'p')
      .orderBy('t.fecha_apertura', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.andWhere(
        '(LOWER(p.nombres) ILIKE :s OR LOWER(p.apellidos) ILIKE :s OR p.cedula ILIKE :s)',
        { s: `%${search.toLowerCase()}%` },
      );
    }
    if (codigoHc) qb.andWhere('t.codigo_hc = :codigoHc', { codigoHc });
    if (estado) qb.andWhere('t.estado = :estado', { estado });
    if (anio) qb.andWhere('t.anio_secuencia = :anio', { anio });

    const [data, total] = await qb.getManyAndCount();
    return PaginatedResponseDto.of(data, total, page, limit);
  }

  // ─── Update ──────────────────────────────────────────────────────────────────

  async update(
    patientId: string,
    dto: UpdateTarjeteroDto,
    userRole: string,
  ): Promise<TarjeteroIndice> {
    const tarjetero = await this.repo.findOne({
      where: { pacienteId: patientId },
      relations: ['paciente'],
    });
    if (!tarjetero) {
      const patient = await this.patientRepo.findOne({ where: { id: patientId }, select: ['id'] });
      if (!patient) throw new NotFoundException(`Paciente ${patientId} no encontrado`);
      throw new NotFoundException(`Paciente ${patientId} no tiene tarjetero`);
    }

    if (dto.estado === EstadoTarjetero.ARCHIVADO && userRole !== 'admin') {
      throw new ForbiddenException('Solo admin puede archivar un tarjetero');
    }

    if (dto.medicoResponsableId !== undefined) tarjetero.medicoResponsableId = dto.medicoResponsableId;
    if (dto.estado !== undefined) tarjetero.estado = dto.estado;
    if (dto.observaciones !== undefined) tarjetero.observaciones = dto.observaciones;

    const saved = await this.repo.save(tarjetero);
    await this.redis.del(
      CK.TARJETERO_PATIENT(patientId),
      CK.TARJETERO_CODIGO(saved.codigoHc),
      CK.TARJETERO_LIST,
    );
    return saved;
  }
}
