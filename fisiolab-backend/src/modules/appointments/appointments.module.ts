import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { Patient } from '../patients/entities/patient.entity';
import { TarjeteroIndice } from '../tarjetero-indice/entities/tarjetero-indice.entity';
import { ClinicalEpisode } from '../clinical-episodes/entities/clinical-episode.entity';
import { UsersModule } from '../users/users.module';
import { SessionsModule } from '../sessions/sessions.module';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { PatientAppointmentsController } from './patient-appointments.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, Patient, TarjeteroIndice, ClinicalEpisode]),
    UsersModule,
    SessionsModule,
  ],
  providers: [AppointmentsService],
  controllers: [AppointmentsController, PatientAppointmentsController],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
