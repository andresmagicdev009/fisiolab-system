import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Auditable } from '../../common/decorators/auditable.decorator';
import { UserRole } from '../../common/enums/roles.enum';
import { HistoriaClinicaService, TimelineEventType } from './historia-clinica.service';

const READERS = [UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA, UserRole.PASANTE];

class TimelineQueryDto {
  @IsOptional() @IsDateString()
  desde?: string;

  @IsOptional() @IsDateString()
  hasta?: string;

  @IsOptional() @IsEnum(
    ['EPISODIO_ABIERTO','EPISODIO_CERRADO','SOAP','EVALUACION','SESION','CITA'],
    { each: true },
  )
  tipos?: TimelineEventType[];

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(500)
  limit?: number;
}

@ApiTags('Historia Clínica')
@ApiBearerAuth('JWT')
@Controller('patients/:patientId')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HistoriaClinicaController {
  constructor(private readonly service: HistoriaClinicaService) {}

  // ─── Resumen completo ─────────────────────────────────────────────────────

  @Get('historia-clinica')
  @Roles(...READERS)
  @Auditable('HC_RESUMEN')
  @ApiOperation({
    summary: 'Historia clínica completa del paciente',
    description:
      'Retorna paciente + tarjetero + antecedentes (4 tipos) + episodios con contadores. ' +
      'Base para generar PDF o vista de resumen.',
  })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiOkResponse({ description: 'Historia clínica completa' })
  @ApiNotFoundResponse({ description: 'Paciente no encontrado' })
  getResumen(@Param('patientId', ParseUUIDPipe) patientId: string) {
    return this.service.getResumen(patientId);
  }

  // ─── Episodio completo ────────────────────────────────────────────────────

  @Get('historia-clinica/episodios/:episodeId')
  @Roles(...READERS)
  @Auditable('HC_EPISODIO')
  @ApiOperation({
    summary: 'Episodio clínico completo con todos sus artefactos',
    description:
      'Retorna episodio + notas SOAP + evaluaciones físicas + planes (con exercises[] y sesiones[]) ' +
      '+ interconsultas + sesiones libres (sin plan). Sin paginación — datos completos para exportar.',
  })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'episodeId', description: 'UUID del episodio' })
  @ApiOkResponse({ description: 'Episodio completo' })
  @ApiNotFoundResponse({ description: 'Paciente o episodio no encontrado' })
  getEpisodioCompleto(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
  ) {
    return this.service.getEpisodioCompleto(patientId, episodeId);
  }

  // ─── Timeline ─────────────────────────────────────────────────────────────

  @Get('timeline')
  @Roles(...READERS)
  @Auditable('HC_TIMELINE')
  @ApiOperation({
    summary: 'Cronología global de eventos clínicos del paciente',
    description:
      'UNION de episodios, SOAP, evaluaciones, sesiones y citas ordenados por fecha DESC. ' +
      'Útil para la vista de línea de tiempo en el frontend.',
  })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiQuery({ name: 'desde', required: false, description: 'YYYY-MM-DD — filtro fecha inicio' })
  @ApiQuery({ name: 'hasta', required: false, description: 'YYYY-MM-DD — filtro fecha fin' })
  @ApiQuery({
    name: 'tipos',
    required: false,
    isArray: true,
    enum: ['EPISODIO_ABIERTO','EPISODIO_CERRADO','SOAP','EVALUACION','SESION','CITA'],
    description: 'Filtrar por tipo de evento',
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Máx eventos a retornar (default 200, max 500)' })
  @ApiOkResponse({ description: 'Array de eventos cronológicos' })
  @ApiNotFoundResponse({ description: 'Paciente no encontrado' })
  getTimeline(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query() query: TimelineQueryDto,
  ) {
    return this.service.getTimeline(patientId, {
      desde:  query.desde,
      hasta:  query.hasta,
      tipos:  query.tipos,
      limit:  query.limit,
    });
  }
}
