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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiNotFoundResponse,
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

@ApiTags('Patients')
@ApiBearerAuth('JWT')
@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA)
  @ApiOperation({ summary: 'Crear paciente', description: 'Roles: admin, médico, fisioterapeuta' })
  @ApiResponse({ status: 201, description: 'Paciente creado', type: Patient })
  @ApiResponse({ status: 400, description: 'Datos inválidos o cédula incorrecta' })
  @ApiResponse({ status: 409, description: 'Cédula o email ya registrado' })
  create(@Body() body: CreatePatientDto): Promise<Patient> {
    return this.patientsService.create(body);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA, UserRole.PASANTE)
  @Auditable('LIST_PATIENTS')
  @ApiOperation({ summary: 'Listar pacientes', description: 'Roles: admin, médico, fisioterapeuta, pasante' })
  @ApiResponse({ status: 200, description: 'Lista de pacientes', type: [Patient] })
  findAll(): Promise<Patient[]> {
    return this.patientsService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA, UserRole.PASANTE)
  @Auditable('READ_PATIENT')
  @ApiOperation({ summary: 'Obtener paciente por ID' })
  @ApiParam({ name: 'id', description: 'UUID del paciente', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiResponse({ status: 200, description: 'Paciente encontrado', type: Patient })
  @ApiNotFoundResponse({ description: 'Paciente no encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Patient> {
    return this.patientsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA)
  @Auditable('UPDATE_PATIENT')
  @ApiOperation({ summary: 'Actualizar paciente', description: 'Roles: admin, médico, fisioterapeuta' })
  @ApiParam({ name: 'id', description: 'UUID del paciente', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiResponse({ status: 200, description: 'Paciente actualizado', type: Patient })
  @ApiNotFoundResponse({ description: 'Paciente no encontrado' })
  @ApiResponse({ status: 409, description: 'Email ya registrado en otro paciente' })
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
  @ApiOperation({ summary: 'Eliminar paciente', description: 'Roles: solo admin' })
  @ApiParam({ name: 'id', description: 'UUID del paciente', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiNoContentResponse({ description: 'Paciente eliminado' })
  @ApiNotFoundResponse({ description: 'Paciente no encontrado' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.patientsService.remove(id);
  }
}
