import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
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
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { CompleteAppointmentDto } from './dto/complete-appointment.dto';
import { CompleteAppointmentResponseDto } from './dto/complete-appointment-response.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { AppointmentQueryDto } from './dto/appointment-query.dto';
import { Appointment } from './entities/appointment.entity';

const READERS = [UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA, UserRole.PASANTE];
const WRITERS = [UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA];

@ApiTags('Appointments')
@ApiBearerAuth('JWT')
@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(private readonly service: AppointmentsService) {}

  @Post()
  @Roles(...WRITERS)
  @HttpCode(HttpStatus.CREATED)
  @Auditable('CREATE_APPOINTMENT')
  @ApiOperation({ summary: 'Crear cita' })
  @ApiResponse({ status: 201, description: 'Cita creada', type: Appointment })
  @ApiNotFoundResponse({ description: 'Paciente no encontrado' })
  @ApiConflictResponse({ description: 'Profesional con cita solapada' })
  @ApiResponse({ status: 422, description: 'Paciente sin tarjetero activo' })
  create(@Body() dto: CreateAppointmentDto): Promise<Appointment> {
    return this.service.create(dto);
  }

  @Get()
  @Roles(...READERS)
  @Auditable('LIST_APPOINTMENTS')
  @ApiOperation({ summary: 'Listar citas (admin: todas; profesional: solo las suyas)' })
  @ApiOkResponse({ description: 'Lista paginada de citas' })
  findAll(
    @Query() query: AppointmentQueryDto,
    @CurrentUser() user: UserPayload,
  ): Promise<PaginatedResponseDto<Appointment>> {
    return this.service.findAll(query, user.userId, user.role);
  }

  @Get(':id')
  @Roles(...READERS)
  @Auditable('READ_APPOINTMENT')
  @ApiOperation({ summary: 'Obtener cita' })
  @ApiParam({ name: 'id', description: 'UUID de la cita' })
  @ApiOkResponse({ description: 'Cita con paciente anidado', type: Appointment })
  @ApiNotFoundResponse({ description: 'Cita no encontrada' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Appointment> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(...WRITERS)
  @Auditable('UPDATE_APPOINTMENT')
  @ApiOperation({ summary: 'Actualizar cita — ajuste menor sin audit trail (solo CONFIRMADA)' })
  @ApiParam({ name: 'id', description: 'UUID de la cita' })
  @ApiOkResponse({ description: 'Cita actualizada', type: Appointment })
  @ApiConflictResponse({ description: 'Nuevo horario solapa otra cita' })
  @ApiResponse({ status: 422, description: 'Cita no está en estado CONFIRMADA' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    return this.service.update(id, dto);
  }

  @Post(':id/cancel')
  @Roles(...WRITERS)
  @Auditable('CANCEL_APPOINTMENT')
  @ApiOperation({ summary: 'Cancelar cita' })
  @ApiParam({ name: 'id', description: 'UUID de la cita' })
  @ApiOkResponse({ description: 'Cita cancelada', type: Appointment })
  @ApiResponse({ status: 422, description: 'Cita no está en estado CONFIRMADA' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelAppointmentDto,
  ): Promise<Appointment> {
    return this.service.cancel(id, dto);
  }

  @Post(':id/complete')
  @Roles(...WRITERS)
  @Auditable('COMPLETE_APPOINTMENT')
  @ApiOperation({ summary: 'Completar cita. Con planId auto-crea Session (CASO 3).' })
  @ApiParam({ name: 'id', description: 'UUID de la cita' })
  @ApiOkResponse({ description: 'Cita completada', type: CompleteAppointmentResponseDto })
  @ApiResponse({ status: 403, description: 'No es el profesional asignado' })
  @ApiResponse({ status: 422, description: 'Cita no está en estado CONFIRMADA' })
  complete(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteAppointmentDto,
    @CurrentUser() user: UserPayload,
  ): Promise<CompleteAppointmentResponseDto> {
    return this.service.complete(id, dto, user.userId, user.role);
  }

  @Post(':id/reschedule')
  @Roles(...WRITERS)
  @Auditable('RESCHEDULE_APPOINTMENT')
  @ApiOperation({
    summary: 'Reprogramar cita — genera audit trail, crea nueva cita CONFIRMADA, marca original REPROGRAMADA',
  })
  @ApiParam({ name: 'id', description: 'UUID de la cita a reprogramar' })
  @ApiResponse({
    status: 200,
    description: '{ original: Appointment(REPROGRAMADA), nueva: Appointment(CONFIRMADA) }',
  })
  @ApiConflictResponse({ description: 'Nuevo horario solapa otra cita del profesional' })
  @ApiResponse({ status: 400, description: 'scheduledAt en el pasado' })
  @ApiResponse({ status: 422, description: 'Cita no está en estado CONFIRMADA' })
  reschedule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RescheduleAppointmentDto,
  ): Promise<{ original: Appointment; nueva: Appointment }> {
    return this.service.reschedule(id, dto);
  }

  @Post(':id/no-show')
  @Roles(...WRITERS)
  @Auditable('NO_SHOW_APPOINTMENT')
  @ApiOperation({ summary: 'Marcar cita como NO_ASISTIO — no genera cobro' })
  @ApiParam({ name: 'id', description: 'UUID de la cita' })
  @ApiOkResponse({ description: 'Cita marcada NO_ASISTIO', type: Appointment })
  @ApiResponse({ status: 422, description: 'Cita no está en estado CONFIRMADA' })
  noShow(@Param('id', ParseUUIDPipe) id: string): Promise<Appointment> {
    return this.service.noShow(id);
  }
}
