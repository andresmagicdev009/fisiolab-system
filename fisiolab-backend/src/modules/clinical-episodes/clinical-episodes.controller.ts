import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { ClinicalEpisodesService } from './clinical-episodes.service';
import { EpisodeQueryDto } from './dto/episode-query.dto';
import { ClinicalEpisode } from './entities/clinical-episode.entity';

const READERS = [UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA, UserRole.PASANTE];

@ApiTags('Clinical Episodes')
@ApiBearerAuth('JWT')
@Controller('episodes')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClinicalEpisodesController {
  constructor(private readonly service: ClinicalEpisodesService) {}

  @Get()
  @Roles(...READERS)
  @Auditable('LIST_EPISODES_GLOBAL')
  @ApiOperation({ summary: 'Listar todos los episodios del sistema (admin/reportes)' })
  @ApiOkResponse({ description: 'Lista paginada de episodios con paciente anidado' })
  findAll(@Query() query: EpisodeQueryDto): Promise<PaginatedResponseDto<ClinicalEpisode>> {
    return this.service.findAll(query);
  }
}
