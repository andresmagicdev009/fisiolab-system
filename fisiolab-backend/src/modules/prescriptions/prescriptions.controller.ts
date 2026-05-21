import {
  Body,
  Controller,
  Delete,
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
  ApiNoContentResponse,
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
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { UpdateMedicationDto } from './dto/update-medication.dto';
import { PrescriptionQueryDto } from './dto/prescription-query.dto';
import { Prescription } from './entities/prescription.entity';
import { Medication } from './entities/medication.entity';

const READERS = [UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA, UserRole.PASANTE];
// Solo MEDICO puede prescribir medicamentos en Ecuador
const PRESCRIBERS = [UserRole.ADMIN, UserRole.MEDICO];

@ApiTags('Prescriptions')
@ApiBearerAuth('JWT')
@Controller('patients/:patientId/episodes/:episodeId/prescriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PrescriptionsController {
  constructor(private readonly service: PrescriptionsService) {}

  // ─── Prescriptions ────────────────────────────────────────────────────────────

  @Post()
  @Roles(...PRESCRIBERS)
  @HttpCode(HttpStatus.CREATED)
  @Auditable('CREATE_PRESCRIPTION')
  @ApiOperation({ summary: 'Crear prescripción médica (opcionalmente con medicamentos inline)' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'episodeId', description: 'UUID del episodio' })
  @ApiResponse({ status: 201, description: 'Prescripción creada con medicamentos', type: Prescription })
  @ApiResponse({ status: 403, description: 'Solo MEDICO o admin puede prescribir' })
  @ApiResponse({ status: 422, description: 'Episodio cerrado o archivado' })
  create(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
    @Body() dto: CreatePrescriptionDto,
  ): Promise<Prescription> {
    return this.service.create(patientId, episodeId, dto);
  }

  @Get()
  @Roles(...READERS)
  @Auditable('LIST_PRESCRIPTIONS')
  @ApiOperation({ summary: 'Listar prescripciones del episodio' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'episodeId', description: 'UUID del episodio' })
  @ApiOkResponse({ description: 'Lista paginada de prescripciones (sin medicamentos)' })
  findAll(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
    @Query() query: PrescriptionQueryDto,
  ): Promise<PaginatedResponseDto<Prescription>> {
    return this.service.findAll(patientId, episodeId, query);
  }

  @Get(':rxId')
  @Roles(...READERS)
  @Auditable('READ_PRESCRIPTION')
  @ApiOperation({ summary: 'Obtener prescripción completa con medicamentos' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'episodeId', description: 'UUID del episodio' })
  @ApiParam({ name: 'rxId', description: 'UUID de la prescripción' })
  @ApiOkResponse({ description: 'Prescripción con medications[] ordenados', type: Prescription })
  @ApiNotFoundResponse({ description: 'Prescripción no encontrada' })
  findOne(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
    @Param('rxId', ParseUUIDPipe) rxId: string,
  ): Promise<Prescription> {
    return this.service.findOne(patientId, episodeId, rxId);
  }

  @Patch(':rxId')
  @Roles(...PRESCRIBERS)
  @Auditable('UPDATE_PRESCRIPTION')
  @ApiOperation({ summary: 'Actualizar prescripción (solo autor o admin, no firmada)' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'episodeId', description: 'UUID del episodio' })
  @ApiParam({ name: 'rxId', description: 'UUID de la prescripción' })
  @ApiOkResponse({ description: 'Prescripción actualizada', type: Prescription })
  @ApiResponse({ status: 403, description: 'No es el médico autor' })
  @ApiResponse({ status: 422, description: 'Prescripción ya firmada — inmutable' })
  update(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
    @Param('rxId', ParseUUIDPipe) rxId: string,
    @Body() dto: UpdatePrescriptionDto,
    @CurrentUser() user: UserPayload,
  ): Promise<Prescription> {
    return this.service.update(patientId, episodeId, rxId, dto, user.userId, user.role);
  }

  // ─── Medications ──────────────────────────────────────────────────────────────

  @Post(':rxId/medications')
  @Roles(...PRESCRIBERS)
  @HttpCode(HttpStatus.CREATED)
  @Auditable('ADD_MEDICATION')
  @ApiOperation({ summary: 'Agregar medicamento a prescripción no firmada' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'episodeId', description: 'UUID del episodio' })
  @ApiParam({ name: 'rxId', description: 'UUID de la prescripción' })
  @ApiResponse({ status: 201, description: 'Medicamento agregado', type: Medication })
  @ApiResponse({ status: 422, description: 'Prescripción ya firmada' })
  addMedication(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
    @Param('rxId', ParseUUIDPipe) rxId: string,
    @Body() dto: CreateMedicationDto,
    @CurrentUser() user: UserPayload,
  ): Promise<Medication> {
    return this.service.addMedication(patientId, episodeId, rxId, dto, user.userId, user.role);
  }

  @Patch(':rxId/medications/:medId')
  @Roles(...PRESCRIBERS)
  @Auditable('UPDATE_MEDICATION')
  @ApiOperation({ summary: 'Actualizar medicamento (solo autor o admin, no firmada)' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'episodeId', description: 'UUID del episodio' })
  @ApiParam({ name: 'rxId', description: 'UUID de la prescripción' })
  @ApiParam({ name: 'medId', description: 'UUID del medicamento' })
  @ApiOkResponse({ description: 'Medicamento actualizado', type: Medication })
  updateMedication(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
    @Param('rxId', ParseUUIDPipe) rxId: string,
    @Param('medId', ParseUUIDPipe) medId: string,
    @Body() dto: UpdateMedicationDto,
    @CurrentUser() user: UserPayload,
  ): Promise<Medication> {
    return this.service.updateMedication(patientId, episodeId, rxId, medId, dto, user.userId, user.role);
  }

  @Delete(':rxId/medications/:medId')
  @Roles(...PRESCRIBERS)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auditable('REMOVE_MEDICATION')
  @ApiOperation({ summary: 'Eliminar medicamento (solo autor o admin, no firmada)' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'episodeId', description: 'UUID del episodio' })
  @ApiParam({ name: 'rxId', description: 'UUID de la prescripción' })
  @ApiParam({ name: 'medId', description: 'UUID del medicamento' })
  @ApiNoContentResponse({ description: 'Medicamento eliminado' })
  removeMedication(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
    @Param('rxId', ParseUUIDPipe) rxId: string,
    @Param('medId', ParseUUIDPipe) medId: string,
    @CurrentUser() user: UserPayload,
  ): Promise<void> {
    return this.service.removeMedication(patientId, episodeId, rxId, medId, user.userId, user.role);
  }
}
