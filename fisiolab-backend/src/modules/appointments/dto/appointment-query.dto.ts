import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { EstadoCita, TipoCita } from '../entities/appointment.entity';

export class AppointmentQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: EstadoCita })
  @IsOptional() @IsEnum(EstadoCita)
  estado?: EstadoCita;

  @ApiPropertyOptional({ enum: TipoCita })
  @IsOptional() @IsEnum(TipoCita)
  tipoCita?: TipoCita;

  @ApiPropertyOptional({ example: 'c3d4e5f6-a7b8-9012-cdef-012345678901' })
  @IsOptional() @IsUUID()
  professionalId?: string;

  @ApiPropertyOptional({ example: 'b2c3d4e5-f6a7-8901-bcde-f01234567890' })
  @IsOptional() @IsUUID()
  patientId?: string;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional() @IsDateString()
  desde?: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsOptional() @IsDateString()
  hasta?: string;
}
