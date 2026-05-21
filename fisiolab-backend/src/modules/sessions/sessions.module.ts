import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from './entities/session.entity';
import { ClinicalEpisode } from '../clinical-episodes/entities/clinical-episode.entity';
import { TreatmentPlan } from '../treatment-plans/entities/treatment-plan.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { SoapNote } from '../soap-notes/entities/soap-note.entity';
import { PhysicalEvaluation } from '../physical-evaluations/entities/physical-evaluation.entity';
import { UsersModule } from '../users/users.module';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { EpisodeSessionsController } from './episode-sessions.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Session,
      ClinicalEpisode,
      TreatmentPlan,
      Appointment,
      SoapNote,
      PhysicalEvaluation,
    ]),
    UsersModule,
  ],
  providers: [SessionsService],
  controllers: [SessionsController, EpisodeSessionsController],
  exports: [SessionsService],
})
export class SessionsModule {}
