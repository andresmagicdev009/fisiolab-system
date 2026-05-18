import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../patients/entities/patient.entity';
import { RedisService } from '../../common/redis/redis.service';
import { UsersService } from '../users/users.service';
import { CK, TTL } from '../../common/redis/cache-keys';
import { HeredofamiliarStrategy } from './strategies/heredofamiliar.strategy';
import { PatologicoStrategy } from './strategies/patologico.strategy';
import { NoPatologicoStrategy } from './strategies/no-patologico.strategy';
import { GinecoStrategy } from './strategies/gineco.strategy';
import { UpdateHeredofamiliarDto } from './dto/update-heredofamiliar.dto';
import { UpdatePatologicoDto } from './dto/update-patologico.dto';
import { UpdateNoPatologicoDto } from './dto/update-no-patologico.dto';
import { UpdateGinecoDto } from './dto/update-gineco.dto';
import { AntecedentesHeredofamiliar } from './entities/antecedentes-heredofamiliar.entity';
import { AntecedentesPatologico } from './entities/antecedentes-patologico.entity';
import { AntecedentesNoPatologico } from './entities/antecedentes-no-patologico.entity';
import { AntecedentesGineco } from './entities/antecedentes-gineco.entity';

export interface AntecedentesCompletos {
  heredofamiliares: AntecedentesHeredofamiliar | null;
  patologicos: AntecedentesPatologico | null;
  noPatologicos: AntecedentesNoPatologico | null;
  ginecoObstetricos: AntecedentesGineco | null;
}

@Injectable()
export class AntecedentesService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    private readonly heredofamiliarStrategy: HeredofamiliarStrategy,
    private readonly patologicoStrategy: PatologicoStrategy,
    private readonly noPatologicoStrategy: NoPatologicoStrategy,
    private readonly ginecoStrategy: GinecoStrategy,
    private readonly redis: RedisService,
    private readonly usersService: UsersService,
  ) {}

  private async assertPatientExists(patientId: string): Promise<void> {
    const exists = await this.patientRepo.findOne({ where: { id: patientId }, select: ['id'] });
    if (!exists) throw new NotFoundException(`Patient ${patientId} not found`);
  }

  private async resolveDbUserId(clerkUserId: string): Promise<string | undefined> {
    const user = await this.usersService.findByExternalId(clerkUserId);
    return user?.id ?? undefined;
  }

  // ─── Heredofamiliares ────────────────────────────────────────────────────────

  async findHeredofamiliares(patientId: string): Promise<AntecedentesHeredofamiliar> {
    await this.assertPatientExists(patientId);
    const cached = await this.redis.get<AntecedentesHeredofamiliar>(CK.ANT_HEREDOFAMILIAR(patientId));
    if (cached) return cached;
    const record = await this.heredofamiliarStrategy.findOrCreate(patientId);
    await this.redis.set(CK.ANT_HEREDOFAMILIAR(patientId), record, TTL.RECORD);
    return record;
  }

  async updateHeredofamiliares(
    patientId: string,
    dto: UpdateHeredofamiliarDto,
    clerkUserId: string,
  ): Promise<AntecedentesHeredofamiliar> {
    await this.assertPatientExists(patientId);
    const saved = await this.heredofamiliarStrategy.update(
      patientId,
      dto,
      await this.resolveDbUserId(clerkUserId),
    );
    await this.redis.del(CK.ANT_HEREDOFAMILIAR(patientId), CK.ANT_ALL(patientId));
    return saved;
  }

  // ─── Patológicos ─────────────────────────────────────────────────────────────

  async findPatologicos(patientId: string): Promise<AntecedentesPatologico> {
    await this.assertPatientExists(patientId);
    const cached = await this.redis.get<AntecedentesPatologico>(CK.ANT_PATOLOGICO(patientId));
    if (cached) return cached;
    const record = await this.patologicoStrategy.findOrCreate(patientId);
    await this.redis.set(CK.ANT_PATOLOGICO(patientId), record, TTL.RECORD);
    return record;
  }

  async updatePatologicos(
    patientId: string,
    dto: UpdatePatologicoDto,
    clerkUserId: string,
  ): Promise<AntecedentesPatologico> {
    await this.assertPatientExists(patientId);
    const saved = await this.patologicoStrategy.update(
      patientId,
      dto,
      await this.resolveDbUserId(clerkUserId),
    );
    await this.redis.del(CK.ANT_PATOLOGICO(patientId), CK.ANT_ALL(patientId));
    return saved;
  }

  // ─── No Patológicos ──────────────────────────────────────────────────────────

  async findNoPatologicos(patientId: string): Promise<AntecedentesNoPatologico> {
    await this.assertPatientExists(patientId);
    const cached = await this.redis.get<AntecedentesNoPatologico>(CK.ANT_NO_PATOLOGICO(patientId));
    if (cached) return cached;
    const record = await this.noPatologicoStrategy.findOrCreate(patientId);
    await this.redis.set(CK.ANT_NO_PATOLOGICO(patientId), record, TTL.RECORD);
    return record;
  }

  async updateNoPatologicos(
    patientId: string,
    dto: UpdateNoPatologicoDto,
    clerkUserId: string,
  ): Promise<AntecedentesNoPatologico> {
    await this.assertPatientExists(patientId);
    const saved = await this.noPatologicoStrategy.update(
      patientId,
      dto,
      await this.resolveDbUserId(clerkUserId),
    );
    await this.redis.del(CK.ANT_NO_PATOLOGICO(patientId), CK.ANT_ALL(patientId));
    return saved;
  }

  // ─── Gineco-Obstétricos ──────────────────────────────────────────────────────

  async findGineco(patientId: string): Promise<AntecedentesGineco> {
    await this.assertPatientExists(patientId);
    const cached = await this.redis.get<AntecedentesGineco>(CK.ANT_GINECO(patientId));
    if (cached) return cached;
    const record = await this.ginecoStrategy.findOrCreate(patientId);
    await this.redis.set(CK.ANT_GINECO(patientId), record, TTL.RECORD);
    return record;
  }

  async updateGineco(
    patientId: string,
    dto: UpdateGinecoDto,
    clerkUserId: string,
  ): Promise<AntecedentesGineco> {
    await this.assertPatientExists(patientId);
    const saved = await this.ginecoStrategy.update(
      patientId,
      dto,
      await this.resolveDbUserId(clerkUserId),
    );
    await this.redis.del(CK.ANT_GINECO(patientId), CK.ANT_ALL(patientId));
    return saved;
  }

  // ─── Resumen completo ────────────────────────────────────────────────────────

  async findAll(patientId: string): Promise<AntecedentesCompletos> {
    await this.assertPatientExists(patientId);
    const cached = await this.redis.get<AntecedentesCompletos>(CK.ANT_ALL(patientId));
    if (cached) return cached;

    const [hf, pat, noPat, gineco] = await Promise.allSettled([
      this.heredofamiliarStrategy.findByPatient(patientId),
      this.patologicoStrategy.findByPatient(patientId),
      this.noPatologicoStrategy.findByPatient(patientId),
      this.ginecoStrategy.findByPatient(patientId),  // puede lanzar ForbiddenException para masculino
    ]);

    const result: AntecedentesCompletos = {
      heredofamiliares: hf.status === 'fulfilled' ? hf.value : null,
      patologicos: pat.status === 'fulfilled' ? pat.value : null,
      noPatologicos: noPat.status === 'fulfilled' ? noPat.value : null,
      ginecoObstetricos: gineco.status === 'fulfilled' ? gineco.value : null,
    };

    await this.redis.set(CK.ANT_ALL(patientId), result, TTL.RECORD);
    return result;
  }
}
