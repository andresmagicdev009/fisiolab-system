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
import { ClinicalEpisodesService } from './clinical-episodes.service';
import { CreateEpisodeDto } from './dto/create-episode.dto';
import { UpdateEpisodeDto } from './dto/update-episode.dto';
import { CloseEpisodeDto } from './dto/close-episode.dto';
import { EpisodeQueryDto } from './dto/episode-query.dto';
import { ClinicalEpisode } from './entities/clinical-episode.entity';

const READERS = [UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA, UserRole.PASANTE];
const WRITERS = [UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA];

@ApiTags('Clinical Episodes')
@ApiBearerAuth('JWT')
@Controller('patients/:patientId/episodes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EpisodePatientController {
  constructor(private readonly service: ClinicalEpisodesService) {}

  @Post()
  @Roles(...WRITERS)
  @HttpCode(HttpStatus.CREATED)
  @Auditable('CREATE_EPISODE')
  @ApiOperation({ summary: 'Abrir nuevo episodio clínico' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiResponse({ status: 201, description: 'Episodio creado', type: ClinicalEpisode })
  @ApiNotFoundResponse({ description: 'Paciente no encontrado o sin tarjetero' })
  @ApiConflictResponse({ description: 'Paciente ya tiene episodio activo' })
  @ApiResponse({ status: 422, description: 'Tarjetero inactivo o archivado' })
  create(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: CreateEpisodeDto,
  ): Promise<ClinicalEpisode> {
    return this.service.create(patientId, dto);
  }

  @Get()
  @Roles(...READERS)
  @Auditable('LIST_EPISODES')
  @ApiOperation({ summary: 'Listar episodios del paciente' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiOkResponse({ description: 'Lista paginada de episodios' })
  @ApiNotFoundResponse({ description: 'Paciente no encontrado' })
  findAllByPatient(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query() query: EpisodeQueryDto,
  ): Promise<PaginatedResponseDto<ClinicalEpisode>> {
    return this.service.findAllByPatient(patientId, query);
  }

  @Get(':episodeId')
  @Roles(...READERS)
  @Auditable('READ_EPISODE')
  @ApiOperation({ summary: 'Obtener episodio completo' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'episodeId', description: 'UUID del episodio' })
  @ApiOkResponse({ description: 'Episodio encontrado', type: ClinicalEpisode })
  @ApiNotFoundResponse({ description: 'Paciente o episodio no encontrado' })
  findOne(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
  ): Promise<ClinicalEpisode> {
    return this.service.findOne(patientId, episodeId);
  }

  @Patch(':episodeId')
  @Roles(...WRITERS)
  @Auditable('UPDATE_EPISODE')
  @ApiOperation({ summary: 'Actualizar episodio o cambiar estado' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'episodeId', description: 'UUID del episodio' })
  @ApiOkResponse({ description: 'Episodio actualizado', type: ClinicalEpisode })
  @ApiNotFoundResponse({ description: 'Paciente o episodio no encontrado' })
  @ApiResponse({ status: 422, description: 'Episodio cerrado o archivado — no editable' })
  update(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
    @Body() dto: UpdateEpisodeDto,
    @CurrentUser() user: UserPayload,
  ): Promise<ClinicalEpisode> {
    return this.service.update(patientId, episodeId, dto, user.role);
  }

  @Post(':episodeId/close')
  @Roles(...WRITERS)
  @HttpCode(HttpStatus.OK)
  @Auditable('CLOSE_EPISODE')
  @ApiOperation({ summary: 'Cerrar episodio clínico (requiere notaCierre)' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'episodeId', description: 'UUID del episodio' })
  @ApiOkResponse({ description: 'Episodio cerrado', type: ClinicalEpisode })
  @ApiNotFoundResponse({ description: 'Paciente o episodio no encontrado' })
  @ApiResponse({ status: 422, description: 'Episodio ya cerrado o archivado' })
  close(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
    @Body() dto: CloseEpisodeDto,
  ): Promise<ClinicalEpisode> {
    return this.service.close(patientId, episodeId, dto);
  }
}
