import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
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
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { PatientFilesService } from './patient-files.service';
import { UploadFileDto } from './dto/upload-file.dto';
import { FileQueryDto } from './dto/file-query.dto';
import { PatientFile } from './entities/patient-file.entity';

const READERS = [UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA, UserRole.PASANTE];
const WRITERS = [UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA];

@ApiTags('Patient Files')
@ApiBearerAuth('JWT')
@Controller('patients/:patientId/files')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientFilesController {
  constructor(private readonly service: PatientFilesService) {}

  @Post()
  @Roles(...WRITERS)
  @HttpCode(HttpStatus.CREATED)
  @Auditable('UPLOAD_PATIENT_FILE')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir archivo al expediente del paciente (máx 20 MB)' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'PDF, JPEG, PNG, TIFF o DICOM' },
        categoria: { type: 'string', enum: ['laboratorio', 'imagen', 'referencia', 'consentimiento', 'receta', 'otro'] },
        descripcion: { type: 'string', maxLength: 500 },
        episodeId: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Archivo subido', type: PatientFile })
  @ApiResponse({ status: 400, description: 'Tipo/tamaño de archivo inválido' })
  uploadFile(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
    @CurrentUser() user: UserPayload,
  ): Promise<PatientFile> {
    return this.service.upload(patientId, file, dto, user.userId);
  }

  @Get()
  @Roles(...READERS)
  @Auditable('LIST_PATIENT_FILES')
  @ApiOperation({ summary: 'Listar archivos del paciente' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiOkResponse({ description: 'Lista paginada de archivos' })
  listFiles(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Query() query: FileQueryDto,
  ): Promise<PaginatedResponseDto<PatientFile>> {
    return this.service.listFiles(patientId, query);
  }

  @Get(':fileId')
  @Roles(...READERS)
  @Auditable('READ_PATIENT_FILE')
  @ApiOperation({ summary: 'Obtener metadata de un archivo' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'fileId', description: 'UUID del archivo' })
  @ApiOkResponse({ description: 'Metadata del archivo', type: PatientFile })
  @ApiNotFoundResponse({ description: 'Archivo no encontrado' })
  getFile(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
  ): Promise<PatientFile> {
    return this.service.getFile(patientId, fileId);
  }

  @Get(':fileId/url')
  @Roles(...READERS)
  @Auditable('PRESIGN_PATIENT_FILE')
  @ApiOperation({ summary: 'Obtener URL firmada para descargar el archivo (válida 15 min)' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'fileId', description: 'UUID del archivo' })
  @ApiOkResponse({ description: 'URL firmada + fecha de expiración', schema: { type: 'object', properties: { url: { type: 'string' }, expiresAt: { type: 'string', format: 'date-time' } } } })
  @ApiNotFoundResponse({ description: 'Archivo no encontrado' })
  getPresignedUrl(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
  ): Promise<{ url: string; expiresAt: string }> {
    return this.service.getPresignedUrl(patientId, fileId);
  }

  @Delete(':fileId')
  @Roles(...WRITERS)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auditable('DELETE_PATIENT_FILE')
  @ApiOperation({ summary: 'Eliminar archivo (solo quien subió o admin)' })
  @ApiParam({ name: 'patientId', description: 'UUID del paciente' })
  @ApiParam({ name: 'fileId', description: 'UUID del archivo' })
  @ApiNoContentResponse({ description: 'Archivo eliminado' })
  @ApiNotFoundResponse({ description: 'Archivo no encontrado' })
  deleteFile(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @CurrentUser() user: UserPayload,
  ): Promise<void> {
    return this.service.deleteFile(patientId, fileId, user.userId, user.role);
  }
}
