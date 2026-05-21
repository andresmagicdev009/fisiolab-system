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
import { SoapNotesService } from './soap-notes.service';
import { CreateSoapNoteDto } from './dto/create-soap-note.dto';
import { UpdateSoapNoteDto } from './dto/update-soap-note.dto';
import { SoapQueryDto } from './dto/soap-query.dto';
import { SoapNote } from './entities/soap-note.entity';

const READERS = [UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA, UserRole.PASANTE];
const WRITERS = [UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA];

@ApiTags('SOAP Notes')
@ApiBearerAuth('JWT')
@Controller('patients/:patientId/episodes/:episodeId/soap')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SoapNotesController {
  constructor(private readonly service: SoapNotesService) {}

  @Post()
  @Roles(...WRITERS)
  @HttpCode(HttpStatus.CREATED)
  @Auditable('CREATE_SOAP')
  @ApiOperation({ summary: 'Registrar nota SOAP de sesión' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'episodeId', description: 'UUID del episodio' })
  @ApiResponse({ status: 201, description: 'Nota SOAP creada', type: SoapNote })
  @ApiNotFoundResponse({ description: 'Paciente o episodio no encontrado' })
  @ApiResponse({ status: 422, description: 'Episodio cerrado o archivado' })
  create(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
    @Body() dto: CreateSoapNoteDto,
  ): Promise<SoapNote> {
    return this.service.create(patientId, episodeId, dto);
  }

  @Get()
  @Roles(...READERS)
  @Auditable('LIST_SOAP')
  @ApiOperation({ summary: 'Listar notas SOAP del episodio' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'episodeId', description: 'UUID del episodio' })
  @ApiOkResponse({ description: 'Lista paginada de notas SOAP' })
  findAll(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
    @Query() query: SoapQueryDto,
  ): Promise<PaginatedResponseDto<SoapNote>> {
    return this.service.findAllByEpisode(patientId, episodeId, query);
  }

  @Get(':soapId')
  @Roles(...READERS)
  @Auditable('READ_SOAP')
  @ApiOperation({ summary: 'Obtener nota SOAP completa' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'episodeId', description: 'UUID del episodio' })
  @ApiParam({ name: 'soapId', description: 'UUID de la nota SOAP' })
  @ApiOkResponse({ description: 'Nota SOAP completa', type: SoapNote })
  @ApiNotFoundResponse({ description: 'Nota no encontrada' })
  findOne(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
    @Param('soapId', ParseUUIDPipe) soapId: string,
  ): Promise<SoapNote> {
    return this.service.findOne(patientId, episodeId, soapId);
  }

  @Patch(':soapId')
  @Roles(...WRITERS)
  @Auditable('UPDATE_SOAP')
  @ApiOperation({ summary: 'Actualizar nota SOAP (solo autor o admin)' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'episodeId', description: 'UUID del episodio' })
  @ApiParam({ name: 'soapId', description: 'UUID de la nota SOAP' })
  @ApiOkResponse({ description: 'Nota SOAP actualizada', type: SoapNote })
  @ApiResponse({ status: 403, description: 'No es el autor de la nota' })
  @ApiResponse({ status: 422, description: 'Episodio cerrado o archivado' })
  update(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('episodeId', ParseUUIDPipe) episodeId: string,
    @Param('soapId', ParseUUIDPipe) soapId: string,
    @Body() dto: UpdateSoapNoteDto,
    @CurrentUser() user: UserPayload,
  ): Promise<SoapNote> {
    return this.service.update(patientId, episodeId, soapId, dto, user.userId, user.role);
  }
}
