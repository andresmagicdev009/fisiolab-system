import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Auditable } from '../../common/decorators/auditable.decorator';
import { UserRole } from '../../common/enums/roles.enum';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { SessionPaymentsService } from './session-payments.service';
import { PaymentQueryDto } from './dto/payment-query.dto';
import { SessionPayment } from './entities/session-payment.entity';

const READERS = [UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA, UserRole.PASANTE];

@ApiTags('Payments')
@ApiBearerAuth('JWT')
@Controller('patients/:patientId/payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientPaymentsController {
  constructor(private readonly service: SessionPaymentsService) {}

  @Get()
  @Roles(...READERS)
  @Auditable('LIST_PATIENT_PAYMENTS')
  @ApiOperation({ summary: 'Listar pagos de un paciente' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiOkResponse({ description: 'Lista paginada de pagos del paciente' })
  findByPatient(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query() query: PaymentQueryDto,
  ): Promise<PaginatedResponseDto<SessionPayment>> {
    return this.service.findByPatient(patientId, query);
  }
}
