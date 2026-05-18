import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Auditable } from '../../common/decorators/auditable.decorator';
import { UserRole } from '../../common/enums/roles.enum';
import { Patient } from './entities/patient.entity';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientQueryDto } from './dto/patient-query.dto';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';

@ApiTags('Patients')
@ApiBearerAuth('JWT')
@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear paciente' })
  @ApiResponse({ status: 201, description: 'Paciente creado', type: Patient })
  @ApiResponse({ status: 400, description: 'Datos inválidos o cédula incorrecta' })
  @ApiResponse({ status: 409, description: 'Cédula ya registrada' })
  create(@Body() body: CreatePatientDto): Promise<Patient> {
    return this.patientsService.create(body);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA, UserRole.PASANTE)
  @Auditable('LIST_PATIENTS')
  @ApiOperation({ summary: 'Listar pacientes con paginación y filtros' })
  @ApiOkResponse({ description: 'Lista paginada de pacientes' })
  findAll(@Query() query: PatientQueryDto): Promise<PaginatedResponseDto<Patient>> {
    return this.patientsService.findAll(query);
  }

  @Get('by-cedula/:cedula')
  @Roles(UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA, UserRole.PASANTE)
  @Auditable('READ_PATIENT')
  @ApiOperation({ summary: 'Buscar paciente por cédula exacta' })
  @ApiParam({ name: 'cedula', example: '1713175071' })
  @ApiResponse({ status: 200, description: 'Paciente encontrado', type: Patient })
  @ApiNotFoundResponse({ description: 'Paciente no encontrado' })
  async findByCedula(@Param('cedula') cedula: string): Promise<Patient> {
    const patient = await this.patientsService.findByCedula(cedula);
    if (!patient) throw new NotFoundException(`Patient with cedula ${cedula} not found`);
    return patient;
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA, UserRole.PASANTE)
  @Auditable('READ_PATIENT')
  @ApiOperation({ summary: 'Obtener paciente por ID' })
  @ApiParam({ name: 'id', description: 'UUID del paciente' })
  @ApiResponse({ status: 200, description: 'Paciente encontrado', type: Patient })
  @ApiNotFoundResponse({ description: 'Paciente no encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Patient> {
    return this.patientsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA)
  @Auditable('UPDATE_PATIENT')
  @ApiOperation({ summary: 'Actualizar paciente (campos parciales)' })
  @ApiParam({ name: 'id', description: 'UUID del paciente' })
  @ApiResponse({ status: 200, description: 'Paciente actualizado', type: Patient })
  @ApiNotFoundResponse({ description: 'Paciente no encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdatePatientDto,
  ): Promise<Patient> {
    return this.patientsService.update(id, body);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @Auditable('DELETE_PATIENT')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar paciente (solo admin)' })
  @ApiParam({ name: 'id', description: 'UUID del paciente' })
  @ApiNoContentResponse({ description: 'Paciente eliminado' })
  @ApiNotFoundResponse({ description: 'Paciente no encontrado' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.patientsService.remove(id);
  }
}
