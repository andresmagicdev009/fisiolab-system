import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionPayment } from './entities/session-payment.entity';
import { SessionPaymentsService } from './session-payments.service';
import { SessionPaymentsController } from './session-payments.controller';
import { PatientPaymentsController } from './patient-payments.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SessionPayment])],
  providers: [SessionPaymentsService],
  controllers: [SessionPaymentsController, PatientPaymentsController],
  exports: [SessionPaymentsService],
})
export class SessionPaymentsModule {}
