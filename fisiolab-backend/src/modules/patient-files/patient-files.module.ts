import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientFile } from './entities/patient-file.entity';
import { Patient } from '../patients/entities/patient.entity';
import { UsersModule } from '../users/users.module';
import { FILE_STORAGE_PROVIDER } from './interfaces/file-storage.provider';
import { R2StorageProvider } from './providers/r2-storage.provider';
import { PatientFilesService } from './patient-files.service';
import { PatientFilesController } from './patient-files.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([PatientFile, Patient]),
    UsersModule,
  ],
  providers: [
    PatientFilesService,
    {
      provide: FILE_STORAGE_PROVIDER,
      useClass: R2StorageProvider,
    },
  ],
  controllers: [PatientFilesController],
  exports: [PatientFilesService],
})
export class PatientFilesModule {}
