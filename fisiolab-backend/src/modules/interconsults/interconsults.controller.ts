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
import { InterconsultsService } from './interconsults.service';
import { CreateInterconsultDto } from './dto/create-interconsult.dto';
import { UpdateInterconsultDto } from './dto/update-interconsult.dto';
import { RespondInterconsultDto } from './dto/respond-interconsult.dto';
import { InterconsultQueryDto } from './dto/interconsult-query.dto';
import { Interconsult } from './entities/interconsult.entity';

const READERS = [UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA, UserRole.PASANTE];
const WRITERS = [UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA];

// ─── Nested under episode ──────────────────────────────────────────────────────

@ApiTags('Interconsults')
@ApiBearerAuth('JWT')
@Controller('patients/:patientId/episodes/:episodeId/interconsults')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EpisodeInterconsultsController {
  constructor(private readonly service: InterconsultsService) {}

  @Post()
  @Roles(...WRITERS)
  @HttpCode(HttpStatus.CREATED)
  @Auditable('CREATE_INTERCONSULT')
  @ApiOperation({ summary: 'Solicitar interconsulta' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'episodeId', description: 'UUID del episodio' })
  @ApiResponse({ status: 201, description: 'Interconsulta creada', type: Interconsult })
  @ApiResponse({ status: 422, description: 'Episodio cerrado o archivado' })
  create(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
    @Body() dto: CreateInterconsultDto,
  ): Promise<Interconsult> {
    return this.service.create(patientId, episodeId, dto);
  }

  @Get()
  @Roles(...READERS)
  @Auditable('LIST_INTERCONSULTS')
  @ApiOperation({ summary: 'Listar interconsultas del episodio' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'episodeId', description: 'UUID del episodio' })
  @ApiOkResponse({ description: 'Lista paginada de interconsultas' })
  findAll(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
    @Query() query: InterconsultQueryDto,
  ): Promise<PaginatedResponseDto<Interconsult>> {
    return this.service.findAllByEpisode(patientId, episodeId, query);
  }

  @Get(':icId')
  @Roles(...READERS)
  @Auditable('READ_INTERCONSULT')
  @ApiOperation({ summary: 'Obtener interconsulta' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'episodeId', description: 'UUID del episodio' })
  @ApiParam({ name: 'icId', description: 'UUID de la interconsulta' })
  @ApiOkResponse({ description: 'Interconsulta completa', type: Interconsult })
  @ApiNotFoundResponse({ description: 'Interconsulta no encontrada' })
  findOne(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
    @Param('icId', ParseUUIDPipe) icId: string,
  ): Promise<Interconsult> {
    return this.service.findOne(patientId, episodeId, icId);
  }

  @Patch(':icId')
  @Roles(...WRITERS)
  @Auditable('UPDATE_INTERCONSULT')
  @ApiOperation({ summary: 'Editar interconsulta (solo solicitante o admin, estado SOLICITADA)' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'episodeId', description: 'UUID del episodio' })
  @ApiParam({ name: 'icId', description: 'UUID de la interconsulta' })
  @ApiOkResponse({ description: 'Interconsulta actualizada', type: Interconsult })
  @ApiResponse({ status: 403, description: 'No es el solicitante' })
  @ApiResponse({ status: 422, description: 'Ya en proceso o respondida' })
  update(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
    @Param('icId', ParseUUIDPipe) icId: string,
    @Body() dto: UpdateInterconsultDto,
    @CurrentUser() user: UserPayload,
  ): Promise<Interconsult> {
    return this.service.update(patientId, episodeId, icId, dto, user.userId, user.role);
  }

  @Post(':icId/accept')
  @Roles(...WRITERS)
  @Auditable('ACCEPT_INTERCONSULT')
  @ApiOperation({ summary: 'Aceptar interconsulta → EN_PROCESO (solo destinatario o admin)' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'episodeId', description: 'UUID del episodio' })
  @ApiParam({ name: 'icId', description: 'UUID de la interconsulta' })
  @ApiOkResponse({ description: 'Interconsulta en proceso', type: Interconsult })
  @ApiResponse({ status: 403, description: 'No es el destinatario' })
  accept(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
    @Param('icId', ParseUUIDPipe) icId: string,
    @CurrentUser() user: UserPayload,
  ): Promise<Interconsult> {
    return this.service.accept(patientId, episodeId, icId, user.userId, user.role);
  }

  @Post(':icId/respond')
  @Roles(...WRITERS)
  @Auditable('RESPOND_INTERCONSULT')
  @ApiOperation({ summary: 'Responder interconsulta → RESPONDIDA (solo destinatario o admin)' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'episodeId', description: 'UUID del episodio' })
  @ApiParam({ name: 'icId', description: 'UUID de la interconsulta' })
  @ApiOkResponse({ description: 'Interconsulta respondida', type: Interconsult })
  @ApiResponse({ status: 403, description: 'No es el destinatario' })
  @ApiResponse({ status: 422, description: 'Ya respondida' })
  respond(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
    @Param('icId', ParseUUIDPipe) icId: string,
    @Body() dto: RespondInterconsultDto,
    @CurrentUser() user: UserPayload,
  ): Promise<Interconsult> {
    return this.service.respond(patientId, episodeId, icId, dto, user.userId, user.role);
  }
}

// ─── Global view ──────────────────────────────────────────────────────────────

@ApiTags('Interconsults')
@ApiBearerAuth('JWT')
@Controller('interconsults')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InterconsultsController {
  constructor(private readonly service: InterconsultsService) {}

  @Get()
  @Roles(...READERS)
  @Auditable('LIST_INTERCONSULTS_GLOBAL')
  @ApiOperation({ summary: 'Listar interconsultas (admin: todas; profesional: las suyas como solicitante o destinatario)' })
  @ApiOkResponse({ description: 'Lista paginada de interconsultas' })
  findAll(
    @Query() query: InterconsultQueryDto,
    @CurrentUser() user: UserPayload,
  ): Promise<PaginatedResponseDto<Interconsult>> {
    return this.service.findAll(query, user.userId, user.role);
  }
}
