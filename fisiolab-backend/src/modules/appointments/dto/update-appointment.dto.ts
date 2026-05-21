import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateAppointmentDto {
  @ApiPropertyOptional({ example: 'c3d4e5f6-a7b8-9012-cdef-012345678901' })
  @IsOptional() @IsUUID()
  professionalId?: string;

  @ApiPropertyOptional({ example: '2024-03-22T14:00:00Z' })
  @IsOptional() @IsISO8601({ strict: true })
  scheduledAt?: string;

  @ApiPropertyOptional({ example: 60, minimum: 15, maximum: 240 })
  @IsOptional() @IsInt() @Min(15) @Max(240)
  durationMinutes?: number;

  @ApiPropertyOptional({ example: 'Dolor lumbar con irradiación.' })
  @IsOptional() @IsString() @MaxLength(500)
  motivo?: string;

  @ApiPropertyOptional({ example: 'Traer estudios de columna.' })
  @IsOptional() @IsString() @MaxLength(1000)
  notas?: string;
}
