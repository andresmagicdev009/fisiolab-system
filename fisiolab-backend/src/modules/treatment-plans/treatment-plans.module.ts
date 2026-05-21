import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TreatmentPlan } from './entities/treatment-plan.entity';
import { ClinicalEpisode } from '../clinical-episodes/entities/clinical-episode.entity';
import { Patient } from '../patients/entities/patient.entity';
import { UsersModule } from '../users/users.module';
import { TreatmentPlansService } from './treatment-plans.service';
import { TreatmentPlansController } from './treatment-plans.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([TreatmentPlan, ClinicalEpisode, Patient]),
    UsersModule,
  ],
  providers: [TreatmentPlansService],
  controllers: [TreatmentPlansController],
  exports: [TreatmentPlansService],
})
export class TreatmentPlansModule {}
