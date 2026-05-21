import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exercise } from './entities/exercise.entity';
import { TreatmentPlan } from '../treatment-plans/entities/treatment-plan.entity';
import { ClinicalEpisode } from '../clinical-episodes/entities/clinical-episode.entity';
import { UsersModule } from '../users/users.module';
import { ExercisesService } from './exercises.service';
import { ExercisesController } from './exercises.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Exercise, TreatmentPlan, ClinicalEpisode]),
    UsersModule,
  ],
  providers: [ExercisesService],
  controllers: [ExercisesController],
  exports: [ExercisesService],
})
export class ExercisesModule {}
