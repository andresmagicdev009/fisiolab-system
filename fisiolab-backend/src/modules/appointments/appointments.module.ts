import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { Availability } from './entities/availability.entity';
import { WaitingList } from './entities/waiting-list.entity';
import { Patient } from '../patients/entities/patient.entity';
import { TarjeteroIndice } from '../tarjetero-indice/entities/tarjetero-indice.entity';
import { ClinicalEpisode } from '../clinical-episodes/entities/clinical-episode.entity';
import { User } from '../users/entities/user.entity';
import { TreatmentPlan } from '../treatment-plans/entities/treatment-plan.entity';
import { Session } from '../sessions/entities/session.entity';
import { UsersModule } from '../users/users.module';
import { SessionsModule } from '../sessions/sessions.module';
import { AppointmentsService } from './appointments.service';
import { AvailabilityService } from './availability.service';
import { SlotFinderService } from './slot-finder.service';
import { WaitingListService } from './waiting-list.service';
import { PlanSchedulingService } from './plan-scheduling.service';
import { AppointmentsController } from './appointments.controller';
import { PatientAppointmentsController } from './patient-appointments.controller';
import { AvailabilityController } from './availability.controller';
import { SlotController } from './slot.controller';
import { WaitingListController } from './waiting-list.controller';
import { PlanSchedulingController } from './plan-scheduling.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      Availability,
      WaitingList,
      Patient,
      TarjeteroIndice,
      ClinicalEpisode,
      User,
      TreatmentPlan,
      Session,
    ]),
    UsersModule,
    SessionsModule,
  ],
  providers: [
    AppointmentsService,
    AvailabilityService,
    SlotFinderService,
    WaitingListService,
    PlanSchedulingService,
  ],
  controllers: [
    AppointmentsController,
    PatientAppointmentsController,
    AvailabilityController,
    SlotController,
    WaitingListController,
    PlanSchedulingController,
  ],
  exports: [AppointmentsService, WaitingListService],
})
export class AppointmentsModule {}
