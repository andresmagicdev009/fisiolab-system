import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Auditable } from '../../common/decorators/auditable.decorator';
import { UserRole } from '../../common/enums/roles.enum';
import {
  PlanSchedulingService,
  PlanWithScheduleResult,
} from './plan-scheduling.service';
import { CreatePlanWithScheduleDto } from './dto/create-plan-with-schedule.dto';

const WRITERS = [UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA];

@ApiTags('PlanScheduling')
@ApiBearerAuth('JWT')
@Controller('patients/:pid/episodes/:eid/plans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlanSchedulingController {
  constructor(private readonly service: PlanSchedulingService) {}

  @Post('with-schedule')
  @Roles(...WRITERS)
  @HttpCode(HttpStatus.CREATED)
  @Auditable('CREATE_PLAN_WITH_SCHEDULE')
  @ApiOperation({
    summary:
      'Crear plan + N sesiones + N citas en transacción atómica con validación de capacidad paralela',
  })
  @ApiParam({ name: 'pid', description: 'UUID del paciente' })
  @ApiParam({ name: 'eid', description: 'UUID del episodio' })
  @ApiResponse({ status: 201, description: 'Plan + sessions + appointments creados' })
  @ApiConflictResponse({
    description:
      'Slots sin cupo (capacidad alcanzada) — payload incluye conflicts[] con suggestedSlots',
  })
  @ApiResponse({ status: 400, description: 'WeeklySchedule inválido o overrides incoherentes' })
  @ApiResponse({ status: 422, description: 'Episodio no acepta planes o horizonte insuficiente' })
  createWithSchedule(
    @Param('pid', new ParseUUIDPipe()) pid: string,
    @Param('eid', new ParseUUIDPipe()) eid: string,
    @Body() dto: CreatePlanWithScheduleDto,
  ): Promise<PlanWithScheduleResult> {
    return this.service.createPlanWithSchedule(pid, eid, dto);
  }
}
