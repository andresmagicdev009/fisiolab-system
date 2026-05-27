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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Auditable } from '../../common/decorators/auditable.decorator';
import { UserRole } from '../../common/enums/roles.enum';
import { WaitingListService } from './waiting-list.service';
import { CreateWaitingListDto } from './dto/create-waiting-list.dto';
import { UpdateWaitingListDto } from './dto/update-waiting-list.dto';
import { WaitingListPriority, WaitingListStatus } from './entities/waiting-list.entity';

class WaitingListQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit: number = 20;
  @IsOptional() @IsEnum(WaitingListStatus)   estado?: WaitingListStatus;
  @IsOptional() @IsEnum(WaitingListPriority) prioridad?: WaitingListPriority;
  @IsOptional() @IsUUID()                    patientId?: string;
  @IsOptional() @IsUUID()                    professionalId?: string;
}

const WRITERS = [UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA];
const READERS = [UserRole.ADMIN, UserRole.MEDICO, UserRole.FISIOTERAPEUTA, UserRole.PASANTE];

@ApiTags('Lista de Espera')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('waiting-list')
export class WaitingListController {
  constructor(private readonly service: WaitingListService) {}

  @Post()
  @Roles(...WRITERS)
  @HttpCode(HttpStatus.CREATED)
  @Auditable('CREATE_WAITING_LIST')
  @ApiOperation({ summary: 'Agregar paciente a lista de espera' })
  @ApiResponse({ status: 201, description: 'Entrada creada' })
  @ApiResponse({ status: 422, description: 'Sin tarjetero activo o ya en lista para esa fecha' })
  create(@Body() dto: CreateWaitingListDto) {
    return this.service.create(dto);
  }

  @Get()
  @Roles(...READERS)
  @Auditable('LIST_WAITING_LIST')
  @ApiOperation({
    summary: 'Listar lista de espera paginada — ordenada por prioridad DESC + FIFO',
  })
  @ApiQuery({ name: 'estado',        required: false, enum: WaitingListStatus })
  @ApiQuery({ name: 'prioridad',     required: false, enum: WaitingListPriority })
  @ApiQuery({ name: 'patientId',     required: false })
  @ApiQuery({ name: 'professionalId', required: false })
  @ApiOkResponse({ description: 'Lista paginada de espera' })
  findAll(@Query() query: WaitingListQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Roles(...READERS)
  @Auditable('READ_WAITING_LIST')
  @ApiOperation({ summary: 'Detalle entrada de lista de espera' })
  @ApiParam({ name: 'id', description: 'UUID de la entrada' })
  @ApiOkResponse({ description: 'Entrada encontrada' })
  @ApiNotFoundResponse({ description: 'Entrada no encontrada' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(...WRITERS)
  @Auditable('UPDATE_WAITING_LIST')
  @ApiOperation({ summary: 'Actualizar entrada — solo en estado PENDING' })
  @ApiParam({ name: 'id', description: 'UUID de la entrada' })
  @ApiOkResponse({ description: 'Entrada actualizada' })
  @ApiResponse({ status: 422, description: 'Entrada no está en estado PENDING' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWaitingListDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(...WRITERS)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auditable('DELETE_WAITING_LIST')
  @ApiOperation({ summary: 'Eliminar entrada — no permitido si ya ASSIGNED' })
  @ApiParam({ name: 'id', description: 'UUID de la entrada' })
  @ApiNoContentResponse({ description: 'Entrada eliminada' })
  @ApiResponse({ status: 422, description: 'Entrada ya fue asignada' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
