import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './entities/patient.entity';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientQueryDto } from './dto/patient-query.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { RedisService } from '../../common/redis/redis.service';
import { CK, TTL } from '../../common/redis/cache-keys';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    private readonly redis: RedisService,
  ) {}

  async create(data: CreatePatientDto): Promise<Patient> {
    const existing = await this.patientsRepository.findOne({
      where: { cedula: data.cedula },
    });

    if (existing) {
      throw new ConflictException(`Cedula ${data.cedula} already registered`);
    }

    const patient = this.patientsRepository.create({
      ...data,
      fechaNacimiento: new Date(data.fechaNacimiento),
    });
    const saved = await this.patientsRepository.save(patient);

    await this.redis.invalidatePattern('patients:list:*');
    return saved;
  }

  async findAll(query: PatientQueryDto): Promise<PaginatedResponseDto<Patient>> {
    const cacheKey = `patients:list:${query.page}:${query.limit}:${query.search ?? ''}:${query.cedula ?? ''}:${query.genero ?? ''}`;
    const cached = await this.redis.get<PaginatedResponseDto<Patient>>(cacheKey);
    if (cached) return cached;

    const qb = this.patientsRepository.createQueryBuilder('p');

    if (query.cedula) {
      qb.andWhere('p.cedula = :cedula', { cedula: query.cedula });
    }
    if (query.search) {
      qb.andWhere(
        '(p.nombres ILIKE :search OR p.apellidos ILIKE :search OR p.email ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }
    if (query.genero) {
      qb.andWhere('p.genero = :genero', { genero: query.genero });
    }

    qb.orderBy('p.apellidos', 'ASC').addOrderBy('p.nombres', 'ASC');
    qb.skip((query.page - 1) * query.limit).take(query.limit);

    const [patients, total] = await qb.getManyAndCount();
    const result = PaginatedResponseDto.of(patients, total, query.page, query.limit);

    await this.redis.set(cacheKey, result, TTL.LIST);
    return result;
  }

  async findOne(id: string): Promise<Patient> {
    const cached = await this.redis.get<Patient>(CK.PATIENT_ID(id));
    if (cached) return cached;

    const patient = await this.patientsRepository.findOne({ where: { id } });
    if (!patient) throw new NotFoundException(`Patient ${id} not found`);

    await this.redis.set(CK.PATIENT_ID(id), patient, TTL.RECORD);
    return patient;
  }

  async findByCedula(cedula: string): Promise<Patient | null> {
    const cached = await this.redis.get<Patient>(CK.PATIENT_CEDULA(cedula));
    if (cached) return cached;

    const patient = await this.patientsRepository.findOne({ where: { cedula } });
    if (patient) await this.redis.set(CK.PATIENT_CEDULA(cedula), patient, TTL.RECORD);
    return patient;
  }

  async update(id: string, data: UpdatePatientDto): Promise<Patient> {
    const patient = await this.findOne(id);
    const { fechaNacimiento, ...rest } = data;
    Object.assign(patient, rest);
    if (fechaNacimiento) patient.fechaNacimiento = new Date(fechaNacimiento);
    const saved = await this.patientsRepository.save(patient);

    await Promise.all([
      this.redis.del(CK.PATIENT_ID(id), CK.PATIENT_CEDULA(saved.cedula)),
      this.redis.invalidatePattern('patients:list:*'),
    ]);
    return saved;
  }

  async remove(id: string): Promise<void> {
    const patient = await this.findOne(id);
    await this.patientsRepository.remove(patient);

    await Promise.all([
      this.redis.del(CK.PATIENT_ID(id), CK.PATIENT_CEDULA(patient.cedula)),
      this.redis.invalidatePattern('patients:list:*'),
    ]);
  }
}
