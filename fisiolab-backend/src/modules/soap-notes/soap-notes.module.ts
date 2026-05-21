import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SoapNote } from './entities/soap-note.entity';
import { ClinicalEpisode } from '../clinical-episodes/entities/clinical-episode.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Session } from '../sessions/entities/session.entity';
import { UsersModule } from '../users/users.module';
import { SessionsModule } from '../sessions/sessions.module';
import { SoapNotesService } from './soap-notes.service';
import { SoapNotesController } from './soap-notes.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([SoapNote, ClinicalEpisode, Patient, Session]),
    UsersModule,
    SessionsModule,
  ],
  providers: [SoapNotesService],
  controllers: [SoapNotesController],
  exports: [SoapNotesService],
})
export class SoapNotesModule {}
