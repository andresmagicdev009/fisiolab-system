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
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Auditable } from '../../common/decorators/auditable.decorator';
import { UserRole } from '../../common/enums/roles.enum';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { SessionsService } from './sessions.service';
import { SessionQueryDto } from './dto/session-query.dto';
import { Session } from './entities/session.entity';

const READERS = [UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA, UserRole.PASANTE];

@ApiTags('Sessions')
@ApiBearerAuth('JWT')
@Controller('patients/:patientId/episodes/:episodeId/sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EpisodeSessionsController {
  constructor(private readonly service: SessionsService) {}

  @Get()
  @Roles(...READERS)
  @Auditable('LIST_EPISODE_SESSIONS')
  @ApiOperation({ summary: 'Listar todas las sesiones del episodio (todos los planes)' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'episodeId', description: 'UUID del episodio' })
  @ApiNotFoundResponse({ description: 'Episodio no encontrado' })
  findAllByEpisode(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
    @Query() query: SessionQueryDto,
  ): Promise<PaginatedResponseDto<Session>> {
    return this.service.findAllByEpisode(patientId, episodeId, query);
  }
}
