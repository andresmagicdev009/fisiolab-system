import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AntecedentesNoPatologico } from '../entities/antecedentes-no-patologico.entity';
import { UpdateNoPatologicoDto } from '../dto/update-no-patologico.dto';
import { IAntecedentesStrategy } from './antecedentes.strategy';

@Injectable()
export class NoPatologicoStrategy
  implements IAntecedentesStrategy<AntecedentesNoPatologico, UpdateNoPatologicoDto>
{
  constructor(
    @InjectRepository(AntecedentesNoPatologico)
    private readonly repo: Repository<AntecedentesNoPatologico>,
  ) {}

  findByPatient(patientId: string): Promise<AntecedentesNoPatologico | null> {
    return this.repo.findOne({ where: { patientId } });
  }

  async findOrCreate(patientId: string): Promise<AntecedentesNoPatologico> {
    const existing = await this.findByPatient(patientId);
    if (existing) return existing;
    return this.repo.save(this.repo.create({ patientId }));
  }

  async update(
    patientId: string,
    dto: UpdateNoPatologicoDto,
    registradoPorId?: string,
  ): Promise<AntecedentesNoPatologico> {
    const record = await this.findOrCreate(patientId);
    Object.assign(record, dto);
    if (registradoPorId) record.registradoPorId = registradoPorId;
    return this.repo.save(record);
  }
}
