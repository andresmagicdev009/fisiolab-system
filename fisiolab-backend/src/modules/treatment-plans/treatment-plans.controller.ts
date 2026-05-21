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
import { TreatmentPlansService } from './treatment-plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { PlanQueryDto } from './dto/plan-query.dto';
import { TreatmentPlan } from './entities/treatment-plan.entity';

const READERS = [UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA, UserRole.PASANTE];
const WRITERS = [UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA];

@ApiTags('Treatment Plans')
@ApiBearerAuth('JWT')
@Controller('patients/:patientId/episodes/:episodeId/plans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TreatmentPlansController {
  constructor(private readonly service: TreatmentPlansService) {}

  @Post()
  @Roles(...WRITERS)
  @HttpCode(HttpStatus.CREATED)
  @Auditable('CREATE_PLAN')
  @ApiOperation({ summary: 'Crear plan de tratamiento' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'episodeId', description: 'UUID del episodio' })
  @ApiResponse({ status: 201, description: 'Plan creado', type: TreatmentPlan })
  @ApiNotFoundResponse({ description: 'Paciente o episodio no encontrado' })
  @ApiResponse({ status: 422, description: 'Episodio cerrado o archivado' })
  createPlan(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
    @Body() dto: CreatePlanDto,
  ): Promise<TreatmentPlan> {
    return this.service.createPlan(patientId, episodeId, dto);
  }

  @Get()
  @Roles(...READERS)
  @Auditable('LIST_PLANS')
  @ApiOperation({ summary: 'Listar planes del episodio' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'episodeId', description: 'UUID del episodio' })
  @ApiOkResponse({ description: 'Lista paginada de planes (sin ejercicios)' })
  findAllPlans(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
    @Query() query: PlanQueryDto,
  ): Promise<PaginatedResponseDto<TreatmentPlan>> {
    return this.service.findAllPlans(patientId, episodeId, query);
  }

  @Get(':planId')
  @Roles(...READERS)
  @Auditable('READ_PLAN')
  @ApiOperation({ summary: 'Obtener plan completo con ejercicios' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'episodeId', description: 'UUID del episodio' })
  @ApiParam({ name: 'planId', description: 'UUID del plan' })
  @ApiOkResponse({ description: 'Plan con exercises[] ordenados', type: TreatmentPlan })
  @ApiNotFoundResponse({ description: 'Plan no encontrado' })
  findOnePlan(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
    @Param('planId', ParseUUIDPipe) planId: string,
  ): Promise<TreatmentPlan> {
    return this.service.findOnePlan(patientId, episodeId, planId);
  }

  @Patch(':planId')
  @Roles(...WRITERS)
  @Auditable('UPDATE_PLAN')
  @ApiOperation({ summary: 'Actualizar plan (solo autor o admin)' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'episodeId', description: 'UUID del episodio' })
  @ApiParam({ name: 'planId', description: 'UUID del plan' })
  @ApiOkResponse({ description: 'Plan actualizado', type: TreatmentPlan })
  @ApiResponse({ status: 403, description: 'No es el autor del plan' })
  @ApiResponse({ status: 422, description: 'Plan o episodio inactivo' })
  updatePlan(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() dto: UpdatePlanDto,
    @CurrentUser() user: UserPayload,
  ): Promise<TreatmentPlan> {
    return this.service.updatePlan(patientId, episodeId, planId, dto, user.userId, user.role);
  }
}
