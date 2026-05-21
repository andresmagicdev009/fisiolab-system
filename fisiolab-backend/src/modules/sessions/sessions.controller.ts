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
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { SessionQueryDto } from './dto/session-query.dto';
import { Session } from './entities/session.entity';

const READERS = [UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA, UserRole.PASANTE];
const WRITERS = [UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA];

@ApiTags('Sessions')
@ApiBearerAuth('JWT')
@Controller('patients/:patientId/episodes/:episodeId/plans/:planId/sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SessionsController {
  constructor(private readonly service: SessionsService) {}

  @Post()
  @Roles(...WRITERS)
  @HttpCode(HttpStatus.CREATED)
  @Auditable('CREATE_SESSION')
  @ApiOperation({ summary: 'Crear sesión en plan de tratamiento' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'episodeId', description: 'UUID del episodio' })
  @ApiParam({ name: 'planId', description: 'UUID del plan' })
  @ApiResponse({ status: 201, description: 'Sesión creada', type: Session })
  @ApiResponse({ status: 400, description: 'fechaSesion futura o cita inválida' })
  @ApiNotFoundResponse({ description: 'Paciente, episodio o plan no encontrado' })
  @ApiResponse({ status: 422, description: 'Episodio o plan inactivo' })
  createSession(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() dto: CreateSessionDto,
  ): Promise<Session> {
    return this.service.createSession(patientId, episodeId, planId, dto);
  }

  @Get()
  @Roles(...READERS)
  @Auditable('LIST_SESSIONS')
  @ApiOperation({ summary: 'Listar sesiones del plan (paginado)' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'episodeId', description: 'UUID del episodio' })
  @ApiParam({ name: 'planId', description: 'UUID del plan' })
  findAllByPlan(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
    @Param('planId', ParseUUIDPipe) planId: string,
    @Query() query: SessionQueryDto,
  ): Promise<PaginatedResponseDto<Session>> {
    return this.service.findAllByPlan(patientId, episodeId, planId, query);
  }

  @Get(':sessionId')
  @Roles(...READERS)
  @Auditable('READ_SESSION')
  @ApiOperation({ summary: 'Detalle de sesión con artefacto clínico vinculado' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'episodeId', description: 'UUID del episodio' })
  @ApiParam({ name: 'planId', description: 'UUID del plan' })
  @ApiParam({ name: 'sessionId', description: 'UUID de la sesión' })
  @ApiNotFoundResponse({ description: 'Sesión no encontrada' })
  findOne(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
    @Param('planId', ParseUUIDPipe) planId: string,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
  ) {
    return this.service.findOne(patientId, episodeId, planId, sessionId);
  }

  @Patch(':sessionId')
  @Roles(...WRITERS)
  @Auditable('UPDATE_SESSION')
  @ApiOperation({ summary: 'Actualizar sesión o transicionar estado (autor/admin)' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'episodeId', description: 'UUID del episodio' })
  @ApiParam({ name: 'planId', description: 'UUID del plan' })
  @ApiParam({ name: 'sessionId', description: 'UUID de la sesión' })
  @ApiResponse({ status: 200, description: 'Sesión actualizada', type: Session })
  @ApiResponse({ status: 403, description: 'No es el autor' })
  @ApiResponse({ status: 422, description: 'Transición inválida o sesión COMPLETADA' })
  updateSession(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
    @Param('planId', ParseUUIDPipe) planId: string,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: UpdateSessionDto,
    @CurrentUser() user: UserPayload,
  ): Promise<Session> {
    return this.service.updateSession(patientId, episodeId, planId, sessionId, dto, user.userId, user.role);
  }

  @Delete(':sessionId')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auditable('DELETE_SESSION')
  @ApiOperation({ summary: 'Eliminar sesión PROGRAMADA (solo admin)' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'episodeId', description: 'UUID del episodio' })
  @ApiParam({ name: 'planId', description: 'UUID del plan' })
  @ApiParam({ name: 'sessionId', description: 'UUID de la sesión' })
  @ApiNoContentResponse({ description: 'Sesión eliminada' })
  @ApiResponse({ status: 422, description: 'Sesión no está en estado PROGRAMADA' })
  deleteSession(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
    @Param('planId', ParseUUIDPipe) planId: string,
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @CurrentUser() user: UserPayload,
  ): Promise<void> {
    return this.service.deleteSession(patientId, episodeId, planId, sessionId, user.role);
  }
}
