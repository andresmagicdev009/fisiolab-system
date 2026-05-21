import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TarjeteroIndice } from './entities/tarjetero-indice.entity';
import { Patient } from '../patients/entities/patient.entity';
import { TarjeteroIndiceService } from './tarjetero-indice.service';
import { TarjeteroPatientController } from './tarjetero-patient.controller';
import { TarjeteroIndiceController } from './tarjetero-indice.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TarjeteroIndice, Patient])],
  providers: [TarjeteroIndiceService],
  controllers: [TarjeteroPatientController, TarjeteroIndiceController],
  exports: [TarjeteroIndiceService],
})
export class TarjeteroIndiceModule {}
