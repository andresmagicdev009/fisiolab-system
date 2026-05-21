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
import { ExercisesService } from './exercises.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { ReorderExercisesDto } from './dto/reorder-exercises.dto';
import { Exercise } from './entities/exercise.entity';

const READERS = [UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA, UserRole.PASANTE];
const WRITERS = [UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA];

@ApiTags('Exercises')
@ApiBearerAuth('JWT')
@Controller('patients/:patientId/episodes/:episodeId/plans/:planId/exercises')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExercisesController {
  constructor(private readonly service: ExercisesService) {}

  @Get()
  @Roles(...READERS)
  @Auditable('LIST_EXERCISES')
  @ApiOperation({ summary: 'Listar ejercicios del plan ordenados por orden' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'episodeId', description: 'UUID del episodio' })
  @ApiParam({ name: 'planId', description: 'UUID del plan' })
  @ApiOkResponse({ description: 'Lista de ejercicios ordenados', type: [Exercise] })
  listExercises(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
    @Param('planId', ParseUUIDPipe) planId: string,
  ): Promise<Exercise[]> {
    return this.service.listExercises(patientId, episodeId, planId);
  }

  @Post()
  @Roles(...WRITERS)
  @HttpCode(HttpStatus.CREATED)
  @Auditable('CREATE_EXERCISE')
  @ApiOperation({ summary: 'Agregar ejercicio al plan' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'episodeId', description: 'UUID del episodio' })
  @ApiParam({ name: 'planId', description: 'UUID del plan' })
  @ApiResponse({ status: 201, description: 'Ejercicio creado', type: Exercise })
  @ApiResponse({ status: 422, description: 'Plan inactivo o prescripción inválida para el tipo' })
  createExercise(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() dto: CreateExerciseDto,
  ): Promise<Exercise> {
    return this.service.createExercise(patientId, episodeId, planId, dto);
  }

  @Patch('reorder')
  @Roles(...WRITERS)
  @Auditable('REORDER_EXERCISES')
  @ApiOperation({ summary: 'Reordenar ejercicios del plan' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'episodeId', description: 'UUID del episodio' })
  @ApiParam({ name: 'planId', description: 'UUID del plan' })
  @ApiOkResponse({ description: 'Ejercicios reordenados', type: [Exercise] })
  reorderExercises(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() dto: ReorderExercisesDto,
    @CurrentUser() user: UserPayload,
  ): Promise<Exercise[]> {
    return this.service.reorderExercises(patientId, episodeId, planId, dto, user.userId, user.role);
  }

  @Patch(':exId')
  @Roles(...WRITERS)
  @Auditable('UPDATE_EXERCISE')
  @ApiOperation({ summary: 'Actualizar ejercicio (solo autor del plan o admin)' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'episodeId', description: 'UUID del episodio' })
  @ApiParam({ name: 'planId', description: 'UUID del plan' })
  @ApiParam({ name: 'exId', description: 'UUID del ejercicio' })
  @ApiOkResponse({ description: 'Ejercicio actualizado', type: Exercise })
  @ApiResponse({ status: 403, description: 'No es el autor del plan' })
  @ApiResponse({ status: 422, description: 'Prescripción inválida para el tipo' })
  updateExercise(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
    @Param('planId', ParseUUIDPipe) planId: string,
    @Param('exId', ParseUUIDPipe) exId: string,
    @Body() dto: UpdateExerciseDto,
    @CurrentUser() user: UserPayload,
  ): Promise<Exercise> {
    return this.service.updateExercise(patientId, episodeId, planId, exId, dto, user.userId, user.role);
  }

  @Delete(':exId')
  @Roles(...WRITERS)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auditable('DELETE_EXERCISE')
  @ApiOperation({ summary: 'Eliminar ejercicio (solo autor del plan o admin)' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'episodeId', description: 'UUID del episodio' })
  @ApiParam({ name: 'planId', description: 'UUID del plan' })
  @ApiParam({ name: 'exId', description: 'UUID del ejercicio' })
  @ApiNoContentResponse({ description: 'Ejercicio eliminado' })
  @ApiNotFoundResponse({ description: 'Ejercicio no encontrado' })
  @ApiResponse({ status: 403, description: 'No es el autor del plan' })
  deleteExercise(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
    @Param('planId', ParseUUIDPipe) planId: string,
    @Param('exId', ParseUUIDPipe) exId: string,
    @CurrentUser() user: UserPayload,
  ): Promise<void> {
    return this.service.deleteExercise(patientId, episodeId, planId, exId, user.userId, user.role);
  }
}
