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
import { TarjeteroIndiceService } from './tarjetero-indice.service';
import { CreateTarjeteroDto } from './dto/create-tarjetero.dto';
import { UpdateTarjeteroDto } from './dto/update-tarjetero.dto';
import { TarjeteroIndice } from './entities/tarjetero-indice.entity';

const READERS = [UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA, UserRole.PASANTE];
const WRITERS = [UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA];

@ApiTags('Tarjetero Índice')
@ApiBearerAuth('JWT')
@Controller('patients/:patientId/tarjetero')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TarjeteroPatientController {
  constructor(private readonly service: TarjeteroIndiceService) {}

  @Post()
  @Roles(...WRITERS)
  @HttpCode(HttpStatus.CREATED)
  @Auditable('CREATE_TARJETERO')
  @ApiOperation({ summary: 'Crear tarjetero índice del paciente (onboarding)' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiResponse({ status: 201, description: 'Tarjetero creado', type: TarjeteroIndice })
  @ApiNotFoundResponse({ description: 'Paciente no encontrado' })
  @ApiConflictResponse({ description: 'El paciente ya tiene un tarjetero' })
  create(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: CreateTarjeteroDto,
  ): Promise<TarjeteroIndice> {
    return this.service.create(patientId, dto);
  }

  @Get()
  @Roles(...READERS)
  @Auditable('READ_TARJETERO')
  @ApiOperation({ summary: 'Obtener tarjetero índice del paciente' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiOkResponse({ description: 'Tarjetero encontrado', type: TarjeteroIndice })
  @ApiNotFoundResponse({ description: 'Paciente o tarjetero no encontrado' })
  findByPatient(
    @Param('patientId', ParseUUIDPipe) patientId: string,
  ): Promise<TarjeteroIndice> {
    return this.service.findByPatient(patientId);
  }

  @Patch()
  @Roles(...WRITERS)
  @Auditable('UPDATE_TARJETERO')
  @ApiOperation({ summary: 'Actualizar tarjetero (estado, médico responsable, observaciones)' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiOkResponse({ description: 'Tarjetero actualizado', type: TarjeteroIndice })
  @ApiNotFoundResponse({ description: 'Paciente o tarjetero no encontrado' })
  update(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: UpdateTarjeteroDto,
    @CurrentUser() user: UserPayload,
  ): Promise<TarjeteroIndice> {
    return this.service.update(patientId, dto, user.role);
  }
}
