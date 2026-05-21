import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from '../patients/entities/patient.entity';
import { TarjeteroIndice } from '../tarjetero-indice/entities/tarjetero-indice.entity';
import { ClinicalEpisode } from '../clinical-episodes/entities/clinical-episode.entity';
import { AntecedentesHeredofamiliar } from '../antecedentes/entities/antecedentes-heredofamiliar.entity';
import { AntecedentesPatologico } from '../antecedentes/entities/antecedentes-patologico.entity';
import { AntecedentesNoPatologico } from '../antecedentes/entities/antecedentes-no-patologico.entity';
import { AntecedentesGineco } from '../antecedentes/entities/antecedentes-gineco.entity';
import { SoapNote } from '../soap-notes/entities/soap-note.entity';
import { PhysicalEvaluation } from '../physical-evaluations/entities/physical-evaluation.entity';
import { TreatmentPlan } from '../treatment-plans/entities/treatment-plan.entity';
import { Exercise } from '../treatment-plans/entities/exercise.entity';
import { Session } from '../sessions/entities/session.entity';
import { Interconsult } from '../interconsults/entities/interconsult.entity';
import { HistoriaClinicaService } from './historia-clinica.service';
import { HistoriaClinicaController } from './historia-clinica.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Patient,
      TarjeteroIndice,
      ClinicalEpisode,
      AntecedentesHeredofamiliar,
      AntecedentesPatologico,
      AntecedentesNoPatologico,
      AntecedentesGineco,
      SoapNote,
      PhysicalEvaluation,
      TreatmentPlan,
      Exercise,
      Session,
      Interconsult,
    ]),
  ],
  providers: [HistoriaClinicaService],
  controllers: [HistoriaClinicaController],
  exports: [HistoriaClinicaService],
})
export class HistoriaClinicaModule {}
