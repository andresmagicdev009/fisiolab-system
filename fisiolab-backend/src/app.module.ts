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
