import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisService } from '../../common/redis/redis.service';
import { CK, TTL } from '../../common/redis/cache-keys';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { TarjeteroIndice, EstadoTarjetero } from '../tarjetero-indice/entities/tarjetero-indice.entity';
import { Appointment, AppointmentBookingType, EstadoCita } from './entities/appointment.entity';
import { WaitingList, WaitingListPriority, WaitingListStatus } from './entities/waiting-list.entity';
import { CreateWaitingListDto } from './dto/create-waiting-list.dto';
import { UpdateWaitingListDto } from './dto/update-waiting-list.dto';

export interface WaitingListQueryDto {
  page: number;
  limit: number;
  estado?: WaitingListStatus;
  prioridad?: WaitingListPriority;
  patientId?: string;
  professionalId?: string;
}

@Injectable()
export class WaitingListService {
  constructor(
    @InjectRepository(WaitingList)
    private readonly repo: Repository<WaitingList>,
    @InjectRepository(TarjeteroIndice)
    private readonly tarjeteroRepo: Repository<TarjeteroIndice>,
    @InjectRepository(Appointment)
    private readonly apptRepo: Repository<Appointment>,
  ) {}

  // ─── Create ──────────────────────────────────────────────────────────────────

  async create(dto: CreateWaitingListDto): Promise<WaitingList> {
    const tarjetero = await this.tarjeteroRepo.findOne({
      where: { pacienteId: dto.patientId },
      select: ['id', 'estado'],
    });
    if (!tarjetero || tarjetero.estado !== EstadoTarjetero.ACTIVO) {
      throw new UnprocessableEntityException(
        'Paciente sin tarjetero índice activo',
      );
    }

    // No duplicates: same patient + same fecha + PENDING
    const dup = await this.repo.findOne({
      where: {
        patientId:    dto.patientId,
        fechaDeseada: dto.fechaDeseada,
        estado:       WaitingListStatus.PENDING,
      },
    });
    if (dup) {
      throw new UnprocessableEntityException(
        `Paciente ya está en lista de espera para ${dto.fechaDeseada}`,
      );
    }

    const entry = this.repo.create({
      patientId:              dto.patientId,
      tipoCitaSolicitado:     dto.tipoCitaSolicitado,
      fechaDeseada:           dto.fechaDeseada,
      preferredProfessionalId: dto.preferredProfessionalId ?? null,
      prioridad:              dto.prioridad ?? WaitingListPriority.NORMAL,
      motivoConsulta:         dto.motivoConsulta ?? null,
      estado:                 WaitingListStatus.PENDING,
      atendidoEn:             null,
      appointmentId:          null,
    });

    return this.repo.save(entry);
  }

  // ─── Find all (paginado + filtros) ───────────────────────────────────────────

  async findAll(query: WaitingListQueryDto): Promise<PaginatedResponseDto<WaitingList>> {
    const { page, limit, estado, prioridad, patientId, professionalId } = query;

    const qb = this.repo
      .createQueryBuilder('w')
      .leftJoinAndSelect('w.patient', 'p')
      .orderBy(`
        CASE w.prioridad
          WHEN 'urgent' THEN 1
          WHEN 'high'   THEN 2
          WHEN 'normal' THEN 3
          WHEN 'low'    THEN 4
        END
      `, 'ASC')
      .addOrderBy('w.created_at', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (estado)         qb.andWhere('w.estado = :estado', { estado });
    if (prioridad)      qb.andWhere('w.prioridad = :prioridad', { prioridad });
    if (patientId)      qb.andWhere('w.patient_id = :patientId', { patientId });
    if (professionalId) qb.andWhere('w.preferred_professional_id = :professionalId', { professionalId });

    const [data, total] = await qb.getManyAndCount();
    return PaginatedResponseDto.of(data, total, page, limit);
  }

  async findOne(id: string): Promise<WaitingList> {
    const entry = await this.repo.findOne({
      where: { id },
      relations: ['patient', 'preferredProfessional'],
    });
    if (!entry) throw new NotFoundException(`Lista de espera ${id} no encontrada`);
    return entry;
  }

  // ─── Update ──────────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateWaitingListDto): Promise<WaitingList> {
    const entry = await this.findOne(id);

    if (entry.estado !== WaitingListStatus.PENDING) {
      throw new UnprocessableEntityException(
        `No se puede modificar entrada en estado ${entry.estado}`,
      );
    }

    if (dto.fechaDeseada           !== undefined) entry.fechaDeseada           = dto.fechaDeseada;
    if (dto.preferredProfessionalId !== undefined) entry.preferredProfessionalId = dto.preferredProfessionalId ?? null;
    if (dto.prioridad              !== undefined) entry.prioridad              = dto.prioridad;
    if (dto.motivoConsulta         !== undefined) entry.motivoConsulta         = dto.motivoConsulta;
    if (dto.estado                 !== undefined) entry.estado                 = dto.estado;

    return this.repo.save(entry);
  }

  async remove(id: string): Promise<void> {
    const entry = await this.findOne(id);
    if (entry.estado === WaitingListStatus.ASSIGNED) {
      throw new UnprocessableEntityException('No se puede eliminar entrada ya asignada');
    }
    await this.repo.remove(entry);
  }

  // ─── Auto-assignment (llamado desde noShow) ────────────────────────────────

  async autoAssignFromSlot(freedAppointment: Appointment): Promise<WaitingList | null> {
    const fechaDeseada = toDateStr(new Date(freedAppointment.scheduledAt));

    // Find best match: same date, same professional (or no preference), PENDING, ordered by priority
    const candidate = await this.repo
      .createQueryBuilder('w')
      .where('w.estado = :estado', { estado: WaitingListStatus.PENDING })
      .andWhere('w.fecha_deseada = :fecha', { fecha: fechaDeseada })
      .andWhere(
        '(w.preferred_professional_id = :profId OR w.preferred_professional_id IS NULL)',
        { profId: freedAppointment.professionalId },
      )
      .orderBy(`
        CASE w.prioridad
          WHEN 'urgent' THEN 1
          WHEN 'high'   THEN 2
          WHEN 'normal' THEN 3
          WHEN 'low'    THEN 4
        END
      `, 'ASC')
      .addOrderBy('w.created_at', 'ASC')
      .getOne();

    if (!candidate) return null;

    // Validate patient still has active tarjetero
    const tarjetero = await this.tarjeteroRepo.findOne({
      where: { pacienteId: candidate.patientId },
      select: ['id', 'estado'],
    });
    if (!tarjetero || tarjetero.estado !== EstadoTarjetero.ACTIVO) {
      candidate.estado = WaitingListStatus.EXPIRED;
      await this.repo.save(candidate);
      return null;
    }

    // Create new appointment at same slot
    const newAppt = this.apptRepo.create({
      patientId:            candidate.patientId,
      professionalId:       candidate.preferredProfessionalId ?? freedAppointment.professionalId,
      scheduledAt:          freedAppointment.scheduledAt,
      durationMinutes:      freedAppointment.durationMinutes,
      tipoCita:             candidate.tipoCitaSolicitado,
      bookingType:          AppointmentBookingType.PRE_BOOK,
      estado:               EstadoCita.CONFIRMADA,
      motivo:               candidate.motivoConsulta ?? null,
      notas:                'Auto-asignada desde lista de espera',
      esReprogNoShow:       true,
      motivoCancelacion:    null,
      episodeId:            null,
      sessionPaymentId:     null,
      reprogramadaDeId:     null,
      nuevaCitaId:          null,
      motivoReprogramacion: null,
      intentosReagendamiento: 0,
    });
    const savedAppt = await this.apptRepo.save(newAppt);

    candidate.estado        = WaitingListStatus.ASSIGNED;
    candidate.atendidoEn    = new Date();
    candidate.appointmentId = savedAppt.id;
    await this.repo.save(candidate);

    return candidate;
  }
}

function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}
