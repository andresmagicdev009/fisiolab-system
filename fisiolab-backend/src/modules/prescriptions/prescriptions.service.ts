import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ClinicalEpisode, EstadoEpisodio } from '../clinical-episodes/entities/clinical-episode.entity';
import { UsersService } from '../users/users.service';
import { RedisService } from '../../common/redis/redis.service';
import { CK, TTL } from '../../common/redis/cache-keys';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { Prescription } from './entities/prescription.entity';
import { Medication, ViaAdministracion } from './entities/medication.entity';
import { PrescriptionBuilder } from './builders/prescription.builder';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { UpdateMedicationDto } from './dto/update-medication.dto';
import { PrescriptionQueryDto } from './dto/prescription-query.dto';

const ACTIVE_EPISODE_STATES = [EstadoEpisodio.ABIERTO, EstadoEpisodio.EN_TRATAMIENTO];

@Injectable()
export class PrescriptionsService {
  constructor(
    @InjectRepository(Prescription)
    private readonly rxRepo: Repository<Prescription>,
    @InjectRepository(Medication)
    private readonly medRepo: Repository<Medication>,
    @InjectRepository(ClinicalEpisode)
    private readonly episodeRepo: Repository<ClinicalEpisode>,
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
    private readonly redis: RedisService,
  ) {}

  // ─── Prescriptions ────────────────────────────────────────────────────────────

  async create(
    patientId: string,
    episodeId: string,
    dto: CreatePrescriptionDto,
  ): Promise<Prescription> {
    const episode = await this.getActiveEpisode(patientId, episodeId);

    return this.dataSource.transaction(async (manager) => {
      const result = await manager.query<{ max: number | null }[]>(
        `SELECT MAX(numero_prescripcion) as max FROM prescriptions WHERE episode_id = $1`,
        [episodeId],
      );
      const numeroPrescripcion = (result[0]?.max ?? 0) + 1;

      const rx = manager.create(Prescription, {
        episodeId,
        codigoHc: episode.codigoHc,
        pacienteId: patientId,
        medicoId: dto.medicoId,
        numeroPrescripcion,
        fechaPrescripcion: new Date(dto.fechaPrescripcion),
        firmaDigital: dto.firmaDigital ?? null,
        observaciones: dto.observaciones ?? null,
        medications: [],
      });

      const savedRx = await manager.save(Prescription, rx);

      if (dto.medications?.length) {
        const builder = new PrescriptionBuilder();
        builder.withMedications(dto.medications);
        const meds = builder.buildMedications();

        for (const med of meds) {
          await manager.save(
            Medication,
            manager.create(Medication, {
              prescriptionId: savedRx.id,
              orden: med.orden ?? 1,
              principioActivo: med.principioActivo,
              nombreComercial: med.nombreComercial ?? null,
              concentracion: med.concentracion ?? null,
              formaFarmaceutica: med.formaFarmaceutica ?? null,
              dosis: med.dosis ?? null,
              viaAdministracion: med.viaAdministracion ?? ViaAdministracion.ORAL,
              frecuencia: med.frecuencia ?? null,
              duracionDias: med.duracionDias ?? null,
              indicaciones: med.indicaciones ?? null,
            }),
          );
        }
      }

      return this.rxRepo.findOne({
        where: { id: savedRx.id },
        relations: ['medications'],
        order: { medications: { orden: 'ASC' } },
      }) as Promise<Prescription>;
    });
  }

  async findAll(
    patientId: string,
    episodeId: string,
    query: PrescriptionQueryDto,
  ): Promise<PaginatedResponseDto<Prescription>> {
    await this.assertEpisodeExists(patientId, episodeId);

    const { page, limit, medicoId, desde, hasta } = query;
    const qb = this.rxRepo
      .createQueryBuilder('rx')
      .where('rx.episode_id = :episodeId', { episodeId })
      .orderBy('rx.numero_prescripcion', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (medicoId) qb.andWhere('rx.medico_id = :medicoId', { medicoId });
    if (desde) qb.andWhere('rx.fecha_prescripcion >= :desde', { desde });
    if (hasta) qb.andWhere('rx.fecha_prescripcion <= :hasta', { hasta });

    const [data, total] = await qb.getManyAndCount();
    data.forEach((rx) => { rx.medications = []; });

    return PaginatedResponseDto.of(data, total, page, limit);
  }

  async findOne(patientId: string, episodeId: string, rxId: string): Promise<Prescription> {
    const cached = await this.redis.get<Prescription>(CK.RX_ID(rxId));
    if (cached) return cached;

    await this.assertEpisodeExists(patientId, episodeId);

    const rx = await this.rxRepo.findOne({
      where: { id: rxId, episodeId },
      relations: ['medications'],
      order: { medications: { orden: 'ASC' } },
    });
    if (!rx) throw new NotFoundException(`Prescripción ${rxId} no encontrada`);

    await this.redis.set(CK.RX_ID(rxId), rx, TTL.RECORD);
    return rx;
  }

  async update(
    patientId: string,
    episodeId: string,
    rxId: string,
    dto: UpdatePrescriptionDto,
    clerkUserId: string,
    userRole: string,
  ): Promise<Prescription> {
    await this.assertEpisodeExists(patientId, episodeId);

    const rx = await this.rxRepo.findOne({ where: { id: rxId, episodeId } });
    if (!rx) throw new NotFoundException(`Prescripción ${rxId} no encontrada`);

    if (rx.firmaDigital) {
      throw new UnprocessableEntityException('Prescripción ya firmada — inmutable');
    }

    await this.assertMedicoOrAdmin(rx.medicoId, clerkUserId, userRole);

    if (dto.medicoId !== undefined) rx.medicoId = dto.medicoId;
    if (dto.fechaPrescripcion !== undefined) rx.fechaPrescripcion = new Date(dto.fechaPrescripcion);
    if (dto.firmaDigital !== undefined) rx.firmaDigital = dto.firmaDigital;
    if (dto.observaciones !== undefined) rx.observaciones = dto.observaciones;

    const saved = await this.rxRepo.save(rx);
    await this.redis.del(CK.RX_ID(rxId));
    return saved;
  }

  // ─── Medications ──────────────────────────────────────────────────────────────

  async addMedication(
    patientId: string,
    episodeId: string,
    rxId: string,
    dto: CreateMedicationDto,
    clerkUserId: string,
    userRole: string,
  ): Promise<Medication> {
    await this.assertEpisodeExists(patientId, episodeId);
    const rx = await this.getUnsignedPrescription(rxId, episodeId);
    await this.assertMedicoOrAdmin(rx.medicoId, clerkUserId, userRole);

    const builder = new PrescriptionBuilder();
    builder.withMedication(dto);

    const result = await this.medRepo.query<{ max: number | null }[]>(
      `SELECT MAX(orden) as max FROM medications WHERE prescription_id = $1`,
      [rxId],
    );
    const nextOrden = (result[0]?.max ?? 0) + 1;

    const [built] = builder.buildMedications();
    const med = this.medRepo.create({
      prescriptionId: rxId,
      orden: built.orden ?? nextOrden,
      principioActivo: built.principioActivo,
      nombreComercial: built.nombreComercial ?? null,
      concentracion: built.concentracion ?? null,
      formaFarmaceutica: built.formaFarmaceutica ?? null,
      dosis: built.dosis ?? null,
      viaAdministracion: built.viaAdministracion ?? ViaAdministracion.ORAL,
      frecuencia: built.frecuencia ?? null,
      duracionDias: built.duracionDias ?? null,
      indicaciones: built.indicaciones ?? null,
    });

    const saved = await this.medRepo.save(med);
    await this.redis.del(CK.RX_ID(rxId));
    return saved;
  }

  async updateMedication(
    patientId: string,
    episodeId: string,
    rxId: string,
    medId: string,
    dto: UpdateMedicationDto,
    clerkUserId: string,
    userRole: string,
  ): Promise<Medication> {
    await this.assertEpisodeExists(patientId, episodeId);
    const rx = await this.getUnsignedPrescription(rxId, episodeId);
    await this.assertMedicoOrAdmin(rx.medicoId, clerkUserId, userRole);

    const med = await this.medRepo.findOne({ where: { id: medId, prescriptionId: rxId } });
    if (!med) throw new NotFoundException(`Medicamento ${medId} no encontrado`);

    if (dto.principioActivo !== undefined) med.principioActivo = dto.principioActivo;
    if (dto.nombreComercial !== undefined) med.nombreComercial = dto.nombreComercial;
    if (dto.concentracion !== undefined) med.concentracion = dto.concentracion;
    if (dto.formaFarmaceutica !== undefined) med.formaFarmaceutica = dto.formaFarmaceutica;
    if (dto.dosis !== undefined) med.dosis = dto.dosis;
    if (dto.viaAdministracion !== undefined) med.viaAdministracion = dto.viaAdministracion;
    if (dto.frecuencia !== undefined) med.frecuencia = dto.frecuencia;
    if (dto.duracionDias !== undefined) med.duracionDias = dto.duracionDias;
    if (dto.indicaciones !== undefined) med.indicaciones = dto.indicaciones;
    if (dto.orden !== undefined) med.orden = dto.orden;

    const saved = await this.medRepo.save(med);
    await this.redis.del(CK.RX_ID(rxId));
    return saved;
  }

  async removeMedication(
    patientId: string,
    episodeId: string,
    rxId: string,
    medId: string,
    clerkUserId: string,
    userRole: string,
  ): Promise<void> {
    await this.assertEpisodeExists(patientId, episodeId);
    const rx = await this.getUnsignedPrescription(rxId, episodeId);
    await this.assertMedicoOrAdmin(rx.medicoId, clerkUserId, userRole);

    const med = await this.medRepo.findOne({ where: { id: medId, prescriptionId: rxId } });
    if (!med) throw new NotFoundException(`Medicamento ${medId} no encontrado`);

    await this.medRepo.remove(med);
    await this.redis.del(CK.RX_ID(rxId));
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async getActiveEpisode(patientId: string, episodeId: string): Promise<ClinicalEpisode> {
    const episode = await this.episodeRepo.findOne({
      where: { id: episodeId, pacienteId: patientId },
    });
    if (!episode) throw new NotFoundException(`Episodio ${episodeId} no encontrado`);
    if (!ACTIVE_EPISODE_STATES.includes(episode.estado)) {
      throw new UnprocessableEntityException(
        `Episodio ${episode.estado} — no acepta nuevas prescripciones`,
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

  private async getUnsignedPrescription(rxId: string, episodeId: string): Promise<Prescription> {
    const rx = await this.rxRepo.findOne({ where: { id: rxId, episodeId } });
    if (!rx) throw new NotFoundException(`Prescripción ${rxId} no encontrada`);
    if (rx.firmaDigital) {
      throw new UnprocessableEntityException('Prescripción ya firmada — inmutable');
    }
    return rx;
  }

  private async assertMedicoOrAdmin(
    medicoId: string,
    clerkUserId: string,
    userRole: string,
  ): Promise<void> {
    if (userRole === 'admin') return;
    const dbUser = await this.usersService.findByExternalId(clerkUserId);
    if (!dbUser || dbUser.id !== medicoId) {
      throw new ForbiddenException('Solo el médico autor o admin puede modificar esta prescripción');
    }
  }
}
