import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AntecedentesHeredofamiliar } from '../entities/antecedentes-heredofamiliar.entity';
import { UpdateHeredofamiliarDto } from '../dto/update-heredofamiliar.dto';
import { IAntecedentesStrategy } from './antecedentes.strategy';

@Injectable()
export class HeredofamiliarStrategy
  implements IAntecedentesStrategy<AntecedentesHeredofamiliar, UpdateHeredofamiliarDto>
{
  constructor(
    @InjectRepository(AntecedentesHeredofamiliar)
    private readonly repo: Repository<AntecedentesHeredofamiliar>,
  ) {}

  findByPatient(patientId: string): Promise<AntecedentesHeredofamiliar | null> {
    return this.repo.findOne({ where: { patientId } });
  }

  async findOrCreate(patientId: string): Promise<AntecedentesHeredofamiliar> {
    const existing = await this.findByPatient(patientId);
    if (existing) return existing;
    return this.repo.save(this.repo.create({ patientId }));
  }

  async update(
    patientId: string,
    dto: UpdateHeredofamiliarDto,
    registradoPorId?: string,
  ): Promise<AntecedentesHeredofamiliar> {
    const record = await this.findOrCreate(patientId);
    Object.assign(record, dto);
    if (registradoPorId) record.registradoPorId = registradoPorId;
    return this.repo.save(record);
  }
}
