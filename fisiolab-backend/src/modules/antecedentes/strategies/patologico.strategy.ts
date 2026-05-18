import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AntecedentesPatologico } from '../entities/antecedentes-patologico.entity';
import { UpdatePatologicoDto } from '../dto/update-patologico.dto';
import { IAntecedentesStrategy } from './antecedentes.strategy';

@Injectable()
export class PatologicoStrategy
  implements IAntecedentesStrategy<AntecedentesPatologico, UpdatePatologicoDto>
{
  constructor(
    @InjectRepository(AntecedentesPatologico)
    private readonly repo: Repository<AntecedentesPatologico>,
  ) {}

  findByPatient(patientId: string): Promise<AntecedentesPatologico | null> {
    return this.repo.findOne({ where: { patientId } });
  }

  async findOrCreate(patientId: string): Promise<AntecedentesPatologico> {
    const existing = await this.findByPatient(patientId);
    if (existing) return existing;
    return this.repo.save(this.repo.create({ patientId }));
  }

  async update(
    patientId: string,
    dto: UpdatePatologicoDto,
    registradoPorId?: string,
  ): Promise<AntecedentesPatologico> {
    const record = await this.findOrCreate(patientId);
    Object.assign(record, dto);
    if (registradoPorId) record.registradoPorId = registradoPorId;
    return this.repo.save(record);
  }
}
