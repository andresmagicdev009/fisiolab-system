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

/**
 * PatientsService — encapsulates all patient business logic.
 * DIP: depends on Repository abstraction, not concrete TypeORM internals.
 * SRP: only manages patient CRUD operations.
 */
@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
  ) {}

  /** Create a new patient profile. Throws ConflictException if cedula already exists. */
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
    return this.patientsRepository.save(patient);
  }

  /** Return all patients. */
  findAll(): Promise<Patient[]> {
    return this.patientsRepository.find();
  }

  /** Find a single patient by UUID. Throws NotFoundException if missing. */
  async findOne(id: string): Promise<Patient> {
    const patient = await this.patientsRepository.findOne({ where: { id } });
    if (!patient) throw new NotFoundException(`Patient ${id} not found`);
    return patient;
  }

  /** Find patient by cedula. */
  findByCedula(cedula: string): Promise<Patient | null> {
    return this.patientsRepository.findOne({ where: { cedula } });
  }

  /** Partial update — only provided fields are updated. */
  async update(id: string, data: UpdatePatientDto): Promise<Patient> {
    const patient = await this.findOne(id);
    const { fechaNacimiento, ...rest } = data;
    Object.assign(patient, rest);
    if (fechaNacimiento) patient.fechaNacimiento = new Date(fechaNacimiento);
    return this.patientsRepository.save(patient);
  }

  /** Soft remove is preferred for medical records — here hard delete for now. */
  async remove(id: string): Promise<void> {
    const patient = await this.findOne(id);
    await this.patientsRepository.remove(patient);
  }
}
