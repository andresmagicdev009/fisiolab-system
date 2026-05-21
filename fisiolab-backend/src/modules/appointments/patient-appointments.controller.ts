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
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Auditable } from '../../common/decorators/auditable.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { UserPayload } from '../auth/strategies/jwt.strategy';
import { UserRole } from '../../common/enums/roles.enum';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { AppointmentsService } from './appointments.service';
import { AppointmentQueryDto } from './dto/appointment-query.dto';
import { EnrichedAppointment } from './dto/enriched-appointment.dto';

const READERS = [UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA, UserRole.PASANTE];

@ApiTags('Appointments')
@ApiBearerAuth('JWT')
@Controller('patients/:patientId/appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientAppointmentsController {
  constructor(private readonly service: AppointmentsService) {}

  @Get()
  @Roles(...READERS)
  @Auditable('LIST_PATIENT_APPOINTMENTS')
  @ApiOperation({
    summary: 'Historial de citas del paciente — respuesta enriquecida con episode, session, payment, cadena reprogramación',
  })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiOkResponse({ description: 'Lista paginada enriquecida de citas' })
  @ApiNotFoundResponse({ description: 'Paciente no encontrado' })
  findAllByPatient(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query() query: AppointmentQueryDto,
    @CurrentUser() user: UserPayload,
  ): Promise<PaginatedResponseDto<EnrichedAppointment>> {
    return this.service.findAllByPatient(patientId, query, user.userId, user.role);
  }
}
