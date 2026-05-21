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
import { PhysicalEvaluationsService } from './physical-evaluations.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { UpdateEvaluationDto } from './dto/update-evaluation.dto';
import { EvaluationQueryDto } from './dto/evaluation-query.dto';
import { PhysicalEvaluation } from './entities/physical-evaluation.entity';

const READERS = [UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA, UserRole.PASANTE];
const WRITERS = [UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA];

@ApiTags('Physical Evaluations')
@ApiBearerAuth('JWT')
@Controller('patients/:patientId/episodes/:episodeId/evaluations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PhysicalEvaluationsController {
  constructor(private readonly service: PhysicalEvaluationsService) {}

  @Post()
  @Roles(...WRITERS)
  @HttpCode(HttpStatus.CREATED)
  @Auditable('CREATE_EVAL')
  @ApiOperation({ summary: 'Registrar evaluación física' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'episodeId', description: 'UUID del episodio' })
  @ApiResponse({ status: 201, description: 'Evaluación creada', type: PhysicalEvaluation })
  @ApiNotFoundResponse({ description: 'Paciente o episodio no encontrado' })
  @ApiResponse({ status: 422, description: 'Episodio cerrado o archivado' })
  create(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
    @Body() dto: CreateEvaluationDto,
  ): Promise<PhysicalEvaluation> {
    return this.service.create(patientId, episodeId, dto);
  }

  @Get()
  @Roles(...READERS)
  @Auditable('LIST_EVAL')
  @ApiOperation({ summary: 'Listar evaluaciones físicas del episodio' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'episodeId', description: 'UUID del episodio' })
  @ApiOkResponse({ description: 'Lista paginada de evaluaciones' })
  findAll(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
    @Query() query: EvaluationQueryDto,
  ): Promise<PaginatedResponseDto<PhysicalEvaluation>> {
    return this.service.findAllByEpisode(patientId, episodeId, query);
  }

  @Get(':evalId')
  @Roles(...READERS)
  @Auditable('READ_EVAL')
  @ApiOperation({ summary: 'Obtener evaluación física completa' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'episodeId', description: 'UUID del episodio' })
  @ApiParam({ name: 'evalId', description: 'UUID de la evaluación' })
  @ApiOkResponse({ description: 'Evaluación completa', type: PhysicalEvaluation })
  @ApiNotFoundResponse({ description: 'Evaluación no encontrada' })
  findOne(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
    @Param('evalId', ParseUUIDPipe) evalId: string,
  ): Promise<PhysicalEvaluation> {
    return this.service.findOne(patientId, episodeId, evalId);
  }

  @Patch(':evalId')
  @Roles(...WRITERS)
  @Auditable('UPDATE_EVAL')
  @ApiOperation({ summary: 'Actualizar evaluación física (solo autor o admin)' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'episodeId', description: 'UUID del episodio' })
  @ApiParam({ name: 'evalId', description: 'UUID de la evaluación' })
  @ApiOkResponse({ description: 'Evaluación actualizada', type: PhysicalEvaluation })
  @ApiResponse({ status: 403, description: 'No es el autor de la evaluación' })
  @ApiResponse({ status: 422, description: 'Episodio cerrado o archivado' })
  update(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
    @Param('evalId', ParseUUIDPipe) evalId: string,
    @Body() dto: UpdateEvaluationDto,
    @CurrentUser() user: UserPayload,
  ): Promise<PhysicalEvaluation> {
    return this.service.update(patientId, episodeId, evalId, dto, user.userId, user.role);
  }
}
