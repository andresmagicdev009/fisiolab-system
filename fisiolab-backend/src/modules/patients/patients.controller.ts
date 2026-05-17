import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
  create(@Body() body: CreatePatientDto): Promise<Patient> {
    return this.patientsService.create(body);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA, UserRole.PASANTE)
  @Auditable('LIST_PATIENTS')
  findAll(): Promise<Patient[]> {
    return this.patientsService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA, UserRole.PASANTE)
  @Auditable('READ_PATIENT')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Patient> {
    return this.patientsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA)
  @Auditable('UPDATE_PATIENT')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdatePatientDto,
  ): Promise<Patient> {
    return this.patientsService.update(id, body);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @Auditable('DELETE_PATIENT')
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.patientsService.remove(id);
  }
}
