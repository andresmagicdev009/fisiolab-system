import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PhysicalEvaluation } from './entities/physical-evaluation.entity';
import { ClinicalEpisode } from '../clinical-episodes/entities/clinical-episode.entity';
import { Patient } from '../patients/entities/patient.entity';
import { UsersModule } from '../users/users.module';
import { PhysicalEvaluationsService } from './physical-evaluations.service';
import { PhysicalEvaluationsController } from './physical-evaluations.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([PhysicalEvaluation, ClinicalEpisode, Patient]),
    UsersModule,
  ],
  providers: [PhysicalEvaluationsService],
  controllers: [PhysicalEvaluationsController],
  exports: [PhysicalEvaluationsService],
})
export class PhysicalEvaluationsModule {}
