import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Interconsult } from './entities/interconsult.entity';
import { ClinicalEpisode } from '../clinical-episodes/entities/clinical-episode.entity';
import { Patient } from '../patients/entities/patient.entity';
import { UsersModule } from '../users/users.module';
import { InterconsultsService } from './interconsults.service';
import { EpisodeInterconsultsController, InterconsultsController } from './interconsults.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Interconsult, ClinicalEpisode, Patient]),
    UsersModule,
  ],
  providers: [InterconsultsService],
  controllers: [EpisodeInterconsultsController, InterconsultsController],
  exports: [InterconsultsService],
})
export class InterconsultsModule {}
