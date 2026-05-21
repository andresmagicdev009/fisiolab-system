import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import databaseConfig from './config/database.config';
import { RedisModule } from './common/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AuditModule } from './modules/audit/audit.module';
import { PatientsModule } from './modules/patients/patients.module';
import { AntecedentesModule } from './modules/antecedentes/antecedentes.module';
import { TarjeteroIndiceModule } from './modules/tarjetero-indice/tarjetero-indice.module';
import { ClinicalEpisodesModule } from './modules/clinical-episodes/clinical-episodes.module';
import { SoapNotesModule } from './modules/soap-notes/soap-notes.module';
import { PhysicalEvaluationsModule } from './modules/physical-evaluations/physical-evaluations.module';
import { TreatmentPlansModule } from './modules/treatment-plans/treatment-plans.module';
import { ExercisesModule } from './modules/exercises/exercises.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { InterconsultsModule } from './modules/interconsults/interconsults.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { HistoriaClinicaModule } from './modules/historia-clinica/historia-clinica.module';
import { PatientFilesModule } from './modules/patient-files/patient-files.module';
import { PrescriptionsModule } from './modules/prescriptions/prescriptions.module';
import { SessionPaymentsModule } from './modules/session-payments/session-payments.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { RolesGuard } from './common/guards/roles.guard';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...configService.get('database'),
        autoLoadEntities: true,
      }),
    }),
    RedisModule,
    AuthModule,
    UsersModule,
    AuditModule,
    PatientsModule,
    AntecedentesModule,
    TarjeteroIndiceModule,
    ClinicalEpisodesModule,
    SoapNotesModule,
    PhysicalEvaluationsModule,
    TreatmentPlansModule,
    ExercisesModule,
    AppointmentsModule,
    InterconsultsModule,
    SessionsModule,
    HistoriaClinicaModule,
    PatientFilesModule,
    PrescriptionsModule,
    SessionPaymentsModule,
    InvoicesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    RolesGuard,
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule implements OnModuleInit {
  private readonly logger = new Logger(AppModule.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onModuleInit() {
    await this.dataSource.query(
      `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
    );
    this.logger.log('Database connected successfully');
  }
}
