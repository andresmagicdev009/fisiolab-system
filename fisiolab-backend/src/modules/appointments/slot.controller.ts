import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Auditable } from '../../common/decorators/auditable.decorator';
import { UserRole } from '../../common/enums/roles.enum';
import { SlotFinderService } from './slot-finder.service';
import { FindSlotsDto } from './dto/find-slots.dto';
import { ValidateScheduleDto, ValidateScheduleResponseDto } from './dto/slot-validation.dto';

const READERS = [UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA, UserRole.PASANTE];
const WRITERS = [UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA];

@ApiTags('Slots Disponibles')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class SlotController {
  constructor(private readonly slotFinder: SlotFinderService) {}

  @Get('available-slots')
  @Roles(...READERS)
  @Auditable('FIND_AVAILABLE_SLOTS')
  @ApiOperation({
    summary: 'Buscar slots con cupo por profesional y rango de fechas',
    description:
      'SDA: startDate = endDate = hoy. PRE_BOOK: startDate >= mañana. EMERGENCIA: cualquier fecha.\n' +
      'Cada slot incluye ocupados/capacidad/cupoDisponible (atención paralela). Cache 60s.',
  })
  @ApiOkResponse({ description: 'Array de slots con disponibilidad y cupo' })
  findSlots(@Query() dto: FindSlotsDto) {
    return this.slotFinder.findAvailableSlots(dto);
  }

  @Post('validate-schedule')
  @Roles(...WRITERS)
  @HttpCode(HttpStatus.OK)
  @Auditable('VALIDATE_SCHEDULE')
  @ApiOperation({
    summary: 'Preview de capacidad para una lista de slots propuestos (sin guardar nada)',
    description:
      'Para cada slot devuelve ocupados/capacidad/cupoDisponible y, si está lleno, suggestedSlots con cupo.',
  })
  @ApiOkResponse({ description: 'Resultados por slot + flag allValid' })
  validate(@Body() dto: ValidateScheduleDto): Promise<ValidateScheduleResponseDto> {
    return this.slotFinder.validateProposedSchedule(dto.professionalId, dto.proposedSlots);
  }
}
