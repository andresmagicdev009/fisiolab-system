import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisService } from '../../common/redis/redis.service';
import { CK } from '../../common/redis/cache-keys';
import { Availability, DayOfWeek } from './entities/availability.entity';
import { User } from '../users/entities/user.entity';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { SlotInputDto } from './dto/batch-replace-availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Availability)
    private readonly repo: Repository<Availability>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly redis: RedisService,
  ) {}

  async create(dto: CreateAvailabilityDto): Promise<Availability> {
    this.assertValidTimeRange(dto.startTime, dto.endTime);

    const overlapping = await this.findOverlap(
      dto.professionalId,
      dto.dayOfWeek,
      dto.startTime,
      dto.endTime,
      null,
    );
    if (overlapping) {
      throw new ConflictException(
        `Profesional ya tiene disponibilidad en ese día/horario (id: ${overlapping.id})`,
      );
    }

    const entity = this.repo.create({
      professionalId:     dto.professionalId,
      dayOfWeek:          dto.dayOfWeek,
      startTime:          dto.startTime,
      endTime:            dto.endTime,
      slotDurationMinutes: dto.slotDurationMinutes ?? 30,
      breakDurationMinutes: dto.breakDurationMinutes ?? 0,
      isActive:           dto.isActive ?? true,
      effectiveFrom:      dto.effectiveFrom ?? null,
      effectiveUntil:     dto.effectiveUntil ?? null,
    });

    const saved = await this.repo.save(entity);
    await this.invalidateCache(dto.professionalId);
    return saved;
  }

  async findByProfessional(professionalId: string): Promise<Availability[]> {
    const cacheKey = CK.AVAIL_PROFESSIONAL(professionalId);
    const cached = await this.redis.get<Availability[]>(cacheKey);
    if (cached) return cached;

    const list = await this.repo.find({
      where: { professionalId },
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });

    await this.redis.set(cacheKey, list, 1800);
    return list;
  }

  async findOne(id: string): Promise<Availability> {
    const avail = await this.repo.findOne({ where: { id } });
    if (!avail) throw new NotFoundException(`Disponibilidad ${id} no encontrada`);
    return avail;
  }

  async update(id: string, dto: UpdateAvailabilityDto): Promise<Availability> {
    const avail = await this.findOne(id);

    const startTime = dto.startTime ?? avail.startTime;
    const endTime   = dto.endTime   ?? avail.endTime;
    this.assertValidTimeRange(startTime, endTime);

    if (dto.startTime || dto.endTime) {
      const overlapping = await this.findOverlap(
        avail.professionalId,
        avail.dayOfWeek,
        startTime,
        endTime,
        id,
      );
      if (overlapping) {
        throw new ConflictException(
          `Horario solapa con disponibilidad existente (id: ${overlapping.id})`,
        );
      }
    }

    if (dto.startTime           !== undefined) avail.startTime           = dto.startTime;
    if (dto.endTime             !== undefined) avail.endTime             = dto.endTime;
    if (dto.slotDurationMinutes !== undefined) avail.slotDurationMinutes = dto.slotDurationMinutes;
    if (dto.breakDurationMinutes !== undefined) avail.breakDurationMinutes = dto.breakDurationMinutes;
    if (dto.isActive            !== undefined) avail.isActive            = dto.isActive;
    if (dto.effectiveFrom       !== undefined) avail.effectiveFrom       = dto.effectiveFrom;
    if (dto.effectiveUntil      !== undefined) avail.effectiveUntil      = dto.effectiveUntil;

    const saved = await this.repo.save(avail);
    await this.invalidateCache(avail.professionalId);
    return saved;
  }

  async remove(id: string): Promise<void> {
    const avail = await this.findOne(id);
    await this.repo.remove(avail);
    await this.invalidateCache(avail.professionalId);
  }

  async batchReplace(professionalId: string, slots: SlotInputDto[]): Promise<Availability[]> {
    for (const slot of slots) {
      this.assertValidTimeRange(slot.startTime, slot.endTime);
    }
    this.assertNoBatchOverlaps(slots);

    const saved = await this.repo.manager.transaction(async manager => {
      await manager.delete(Availability, { professionalId });
      if (slots.length === 0) return [];

      const entities = slots.map(s =>
        manager.create(Availability, {
          professionalId,
          dayOfWeek:            s.dayOfWeek,
          startTime:            s.startTime,
          endTime:              s.endTime,
          slotDurationMinutes:  s.slotDurationMinutes  ?? 30,
          breakDurationMinutes: s.breakDurationMinutes ?? 0,
          isActive:             s.isActive             ?? true,
          zonaHoraria:          s.zonaHoraria          ?? 'America/Guayaquil',
        }),
      );
      return manager.save(Availability, entities);
    });

    await this.invalidateCache(professionalId);
    return saved;
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private assertValidTimeRange(startTime: string, endTime: string): void {
    if (startTime >= endTime) {
      throw new UnprocessableEntityException('startTime debe ser menor que endTime');
    }
  }

  private assertNoBatchOverlaps(slots: SlotInputDto[]): void {
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const a = slots[i];
        const b = slots[j];
        if (
          a.dayOfWeek === b.dayOfWeek &&
          a.startTime < b.endTime &&
          a.endTime   > b.startTime
        ) {
          throw new ConflictException(
            `Slots [${i}] y [${j}] se solapan el mismo día (${a.dayOfWeek})`,
          );
        }
      }
    }
  }

  private async findOverlap(
    professionalId: string,
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string,
    excludeId: string | null,
  ): Promise<Availability | null> {
    const qb = this.repo
      .createQueryBuilder('a')
      .where('a.professional_id = :professionalId', { professionalId })
      .andWhere('a.day_of_week = :dayOfWeek', { dayOfWeek })
      .andWhere('a.is_active = true')
      .andWhere('a.start_time < :endTime',   { endTime })
      .andWhere('a.end_time   > :startTime', { startTime })
      .limit(1);

    if (excludeId) qb.andWhere('a.id != :excludeId', { excludeId });

    return qb.getOne();
  }

  private async invalidateCache(professionalId: string): Promise<void> {
    const keys: string[] = [CK.AVAIL_PROFESSIONAL(professionalId)];

    const user = await this.userRepo.findOne({
      where: { id: professionalId },
      select: ['externalAuthId'],
    });
    if (user?.externalAuthId) {
      keys.push(CK.USER_PROFILE(user.externalAuthId));
    }

    await this.redis.del(...keys);
  }
}
