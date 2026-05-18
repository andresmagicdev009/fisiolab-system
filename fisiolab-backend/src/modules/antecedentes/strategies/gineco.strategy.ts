import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AntecedentesGineco } from '../entities/antecedentes-gineco.entity';
import { UpdateGinecoDto } from '../dto/update-gineco.dto';
import { IAntecedentesStrategy } from './antecedentes.strategy';
import { Patient, Genero } from '../../patients/entities/patient.entity';

@Injectable()
export class GinecoStrategy
  implements IAntecedentesStrategy<AntecedentesGineco, UpdateGinecoDto>
{
  constructor(
    @InjectRepository(AntecedentesGineco)
    private readonly repo: Repository<AntecedentesGineco>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
  ) {}

  private async assertFemenino(patientId: string): Promise<void> {
    const patient = await this.patientRepo.findOne({
      where: { id: patientId },
      select: ['id', 'genero'],
    });
    if (patient?.genero !== Genero.FEMENINO) {
      throw new ForbiddenException(
        'Antecedentes gineco-obstétricos solo disponibles para pacientes de género femenino',
      );
    }
  }

  async findByPatient(patientId: string): Promise<AntecedentesGineco | null> {
    await this.assertFemenino(patientId);
    return this.repo.findOne({ where: { patientId } });
  }

  async findOrCreate(patientId: string): Promise<AntecedentesGineco> {
    await this.assertFemenino(patientId);
    const existing = await this.repo.findOne({ where: { patientId } });
    if (existing) return existing;
    return this.repo.save(this.repo.create({ patientId }));
  }

  async update(
    patientId: string,
    dto: UpdateGinecoDto,
    registradoPorId?: string,
  ): Promise<AntecedentesGineco> {
    const record = await this.findOrCreate(patientId);
    Object.assign(record, dto);
    if (registradoPorId) record.registradoPorId = registradoPorId;
    return this.repo.save(record);
  }
}
