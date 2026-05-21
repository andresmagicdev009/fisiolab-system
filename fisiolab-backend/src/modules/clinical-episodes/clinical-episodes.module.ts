import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClinicalEpisode } from './entities/clinical-episode.entity';
import { Patient } from '../patients/entities/patient.entity';
import { TarjeteroIndice } from '../tarjetero-indice/entities/tarjetero-indice.entity';
import { ClinicalEpisodesService } from './clinical-episodes.service';
import { EpisodePatientController } from './episode-patient.controller';
import { ClinicalEpisodesController } from './clinical-episodes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ClinicalEpisode, Patient, TarjeteroIndice])],
  providers: [ClinicalEpisodesService],
  controllers: [EpisodePatientController, ClinicalEpisodesController],
  exports: [ClinicalEpisodesService],
})
export class ClinicalEpisodesModule {}
