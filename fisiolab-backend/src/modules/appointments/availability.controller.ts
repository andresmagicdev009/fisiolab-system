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
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
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
import { UserRole } from '../../common/enums/roles.enum';
import { AvailabilityService } from './availability.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { BatchReplaceAvailabilityDto } from './dto/batch-replace-availability.dto';

const WRITERS = [UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA];
const READERS = [UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA, UserRole.PASANTE];

@ApiTags('Disponibilidad Profesionales')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('professionals/:professionalId/availability')
export class AvailabilityController {
  constructor(private readonly service: AvailabilityService) {}

  @Put()
  @Roles(...WRITERS)
  @HttpCode(HttpStatus.OK)
  @Auditable('BATCH_REPLACE_AVAILABILITY')
  @ApiOperation({ summary: 'Reemplazar toda la disponibilidad semanal (onboarding / gestión diaria)' })
  @ApiParam({ name: 'professionalId', description: 'UUID del profesional' })
  @ApiOkResponse({ description: 'Disponibilidad actualizada' })
  @ApiConflictResponse({ description: 'Slots se solapan entre sí' })
  batchReplace(
    @Param('professionalId', ParseUUIDPipe) professionalId: string,
    @Body() dto: BatchReplaceAvailabilityDto,
  ) {
    return this.service.batchReplace(professionalId, dto.slots);
  }

  @Post()
  @Roles(...WRITERS)
  @HttpCode(HttpStatus.CREATED)
  @Auditable('CREATE_AVAILABILITY')
  @ApiOperation({ summary: 'Definir bloque horario para un profesional' })
  @ApiParam({ name: 'professionalId', description: 'UUID del profesional' })
  @ApiResponse({ status: 201, description: 'Disponibilidad creada' })
  @ApiConflictResponse({ description: 'Solapa con bloque existente' })
  create(
    @Param('professionalId', ParseUUIDPipe) professionalId: string,
    @Body() dto: CreateAvailabilityDto,
  ) {
    dto.professionalId = professionalId;
    return this.service.create(dto);
  }

  @Get()
  @Roles(...READERS)
  @Auditable('LIST_AVAILABILITY')
  @ApiOperation({ summary: 'Listar disponibilidad del profesional' })
  @ApiParam({ name: 'professionalId', description: 'UUID del profesional' })
  @ApiOkResponse({ description: 'Lista de bloques horarios' })
  findAll(@Param('professionalId', ParseUUIDPipe) professionalId: string) {
    return this.service.findByProfessional(professionalId);
  }

  @Get(':availId')
  @Roles(...READERS)
  @Auditable('READ_AVAILABILITY')
  @ApiOperation({ summary: 'Obtener bloque de disponibilidad' })
  @ApiParam({ name: 'professionalId', description: 'UUID del profesional' })
  @ApiParam({ name: 'availId', description: 'UUID del bloque' })
  @ApiOkResponse({ description: 'Bloque encontrado' })
  @ApiNotFoundResponse({ description: 'Bloque no encontrado' })
  findOne(@Param('availId', ParseUUIDPipe) availId: string) {
    return this.service.findOne(availId);
  }

  @Patch(':availId')
  @Roles(...WRITERS)
  @Auditable('UPDATE_AVAILABILITY')
  @ApiOperation({ summary: 'Actualizar bloque de disponibilidad' })
  @ApiParam({ name: 'professionalId', description: 'UUID del profesional' })
  @ApiParam({ name: 'availId', description: 'UUID del bloque' })
  @ApiOkResponse({ description: 'Bloque actualizado' })
  @ApiConflictResponse({ description: 'Nuevo horario solapa con otro bloque' })
  update(
    @Param('availId', ParseUUIDPipe) availId: string,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.service.update(availId, dto);
  }

  @Delete(':availId')
  @Roles(...WRITERS)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auditable('DELETE_AVAILABILITY')
  @ApiOperation({ summary: 'Eliminar bloque de disponibilidad' })
  @ApiParam({ name: 'professionalId', description: 'UUID del profesional' })
  @ApiParam({ name: 'availId', description: 'UUID del bloque' })
  @ApiNoContentResponse({ description: 'Bloque eliminado' })
  @ApiNotFoundResponse({ description: 'Bloque no encontrado' })
  remove(@Param('availId', ParseUUIDPipe) availId: string) {
    return this.service.remove(availId);
  }
}
