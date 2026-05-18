import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AntecedentesHeredofamiliar } from './entities/antecedentes-heredofamiliar.entity';
import { AntecedentesPatologico } from './entities/antecedentes-patologico.entity';
import { AntecedentesNoPatologico } from './entities/antecedentes-no-patologico.entity';
import { AntecedentesGineco } from './entities/antecedentes-gineco.entity';
import { Patient } from '../patients/entities/patient.entity';
import { HeredofamiliarStrategy } from './strategies/heredofamiliar.strategy';
import { PatologicoStrategy } from './strategies/patologico.strategy';
import { NoPatologicoStrategy } from './strategies/no-patologico.strategy';
import { GinecoStrategy } from './strategies/gineco.strategy';
import { AntecedentesFactory } from './factory/antecedentes.factory';
import { AntecedentesService } from './antecedentes.service';
import { AntecedentesController } from './antecedentes.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AntecedentesHeredofamiliar,
      AntecedentesPatologico,
      AntecedentesNoPatologico,
      AntecedentesGineco,
      Patient,
    ]),
    UsersModule,
  ],
  providers: [
    HeredofamiliarStrategy,
    PatologicoStrategy,
    NoPatologicoStrategy,
    GinecoStrategy,
    AntecedentesFactory,
    AntecedentesService,
  ],
  controllers: [AntecedentesController],
  exports: [AntecedentesService],
})
export class AntecedentesModule {}
