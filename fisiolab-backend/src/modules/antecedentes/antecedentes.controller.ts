import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
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
import { AntecedentesService } from './antecedentes.service';
import { UpdateHeredofamiliarDto } from './dto/update-heredofamiliar.dto';
import { UpdatePatologicoDto } from './dto/update-patologico.dto';
import { UpdateNoPatologicoDto } from './dto/update-no-patologico.dto';
import { UpdateGinecoDto } from './dto/update-gineco.dto';

const READERS = [UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA, UserRole.PASANTE];
const WRITERS = [UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA];

@ApiTags('Antecedentes')
@ApiBearerAuth('JWT')
@Controller('patients/:patientId/antecedentes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AntecedentesController {
  constructor(private readonly service: AntecedentesService) {}

  // ─── Resumen ─────────────────────────────────────────────────────────────────

  @Get()
  @Roles(...READERS)
  @Auditable('READ_ANTECEDENTES_ALL')
  @ApiOperation({ summary: 'Todos los antecedentes del paciente (resumen)' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiOkResponse({ description: 'Antecedentes completos (ginecoObstetricos null en pacientes masculinos)' })
  @ApiNotFoundResponse({ description: 'Paciente no encontrado' })
  findAll(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.service.findAll(patientId);
  }

  // ─── Heredofamiliares ────────────────────────────────────────────────────────

  @Get('heredofamiliares')
  @Roles(...READERS)
  @Auditable('READ_ANTECEDENTES_HF')
  @ApiOperation({ summary: 'Antecedentes heredofamiliares' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  findHeredofamiliares(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.service.findHeredofamiliares(patientId);
  }

  @Patch('heredofamiliares')
  @Roles(...WRITERS)
  @Auditable('UPDATE_ANTECEDENTES_HF')
  @ApiOperation({ summary: 'Actualizar antecedentes heredofamiliares' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  updateHeredofamiliares(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: UpdateHeredofamiliarDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.service.updateHeredofamiliares(patientId, dto, user.userId);
  }

  // ─── Patológicos ─────────────────────────────────────────────────────────────

  @Get('patologicos')
  @Roles(...READERS)
  @Auditable('READ_ANTECEDENTES_PAT')
  @ApiOperation({ summary: 'Antecedentes personales patológicos' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  findPatologicos(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.service.findPatologicos(patientId);
  }

  @Patch('patologicos')
  @Roles(...WRITERS)
  @Auditable('UPDATE_ANTECEDENTES_PAT')
  @ApiOperation({ summary: 'Actualizar antecedentes personales patológicos' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  updatePatologicos(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: UpdatePatologicoDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.service.updatePatologicos(patientId, dto, user.userId);
  }

  // ─── No Patológicos ──────────────────────────────────────────────────────────

  @Get('no-patologicos')
  @Roles(...READERS)
  @Auditable('READ_ANTECEDENTES_NP')
  @ApiOperation({ summary: 'Antecedentes personales no patológicos' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  findNoPatologicos(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.service.findNoPatologicos(patientId);
  }

  @Patch('no-patologicos')
  @Roles(...WRITERS)
  @Auditable('UPDATE_ANTECEDENTES_NP')
  @ApiOperation({ summary: 'Actualizar antecedentes personales no patológicos' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  updateNoPatologicos(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: UpdateNoPatologicoDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.service.updateNoPatologicos(patientId, dto, user.userId);
  }

  // ─── Gineco-Obstétricos ──────────────────────────────────────────────────────

  @Get('gineco-obstetricos')
  @Roles(...READERS)
  @Auditable('READ_ANTECEDENTES_GO')
  @ApiOperation({ summary: 'Antecedentes gineco-obstétricos (solo pacientes femeninas)' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiForbiddenResponse({ description: 'Paciente no es de género femenino' })
  findGineco(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.service.findGineco(patientId);
  }

  @Patch('gineco-obstetricos')
  @Roles(...WRITERS)
  @Auditable('UPDATE_ANTECEDENTES_GO')
  @ApiOperation({ summary: 'Actualizar antecedentes gineco-obstétricos' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiForbiddenResponse({ description: 'Paciente no es de género femenino' })
  updateGineco(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: UpdateGinecoDto,
    @CurrentUser() user: UserPayload,
  ) {
    return this.service.updateGineco(patientId, dto, user.userId);
  }
}
