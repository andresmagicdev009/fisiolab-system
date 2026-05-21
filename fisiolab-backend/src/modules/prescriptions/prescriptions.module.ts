import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prescription } from './entities/prescription.entity';
import { Medication } from './entities/medication.entity';
import { ClinicalEpisode } from '../clinical-episodes/entities/clinical-episode.entity';
import { UsersModule } from '../users/users.module';
import { PrescriptionsService } from './prescriptions.service';
import { PrescriptionsController } from './prescriptions.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Prescription, Medication, ClinicalEpisode]),
    UsersModule,
  ],
  providers: [PrescriptionsService],
  controllers: [PrescriptionsController],
  exports: [PrescriptionsService],
})
export class PrescriptionsModule {}
