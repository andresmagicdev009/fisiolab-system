import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
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
import { TarjeteroIndiceService } from './tarjetero-indice.service';
import { TarjeteroQueryDto } from './dto/tarjetero-query.dto';
import { TarjeteroIndice } from './entities/tarjetero-indice.entity';

const READERS = [UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA, UserRole.PASANTE];

@ApiTags('Tarjetero Índice')
@ApiBearerAuth('JWT')
@Controller('tarjetero')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TarjeteroIndiceController {
  constructor(private readonly service: TarjeteroIndiceService) {}

  @Get()
  @Roles(...READERS)
  @Auditable('LIST_TARJETERO')
  @ApiOperation({ summary: 'Listar tarjeteros con paginación y filtros' })
  @ApiOkResponse({ description: 'Lista paginada de tarjeteros' })
  findAll(@Query() query: TarjeteroQueryDto): Promise<PaginatedResponseDto<TarjeteroIndice>> {
    return this.service.findAll(query);
  }

  @Get('by-codigo/:codigoHc')
  @Roles(...READERS)
  @Auditable('READ_TARJETERO')
  @ApiOperation({ summary: 'Buscar tarjetero por código HC exacto' })
  @ApiParam({ name: 'codigoHc', example: 'HC-2024-0037' })
  @ApiOkResponse({ description: 'Tarjetero encontrado', type: TarjeteroIndice })
  @ApiNotFoundResponse({ description: 'Código HC no encontrado' })
  findByCodigo(@Param('codigoHc') codigoHc: string): Promise<TarjeteroIndice> {
    return this.service.findByCodigo(codigoHc);
  }
}
