import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { TipoCita } from '../entities/appointment.entity';

export class CreateAppointmentDto {
  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f01234567890' })
  @IsUUID()
  patientId!: string;

  @ApiProperty({ example: 'c3d4e5f6-a7b8-9012-cdef-012345678901' })
  @IsUUID()
  professionalId!: string;

  @ApiProperty({ example: '2024-03-20T10:00:00Z', description: 'ISO 8601 con hora — no puede ser en el pasado' })
  @IsISO8601({ strict: true })
  scheduledAt!: string;

  @ApiProperty({ enum: TipoCita })
  @IsEnum(TipoCita)
  tipoCita!: TipoCita;

  @ApiPropertyOptional({ example: 60, minimum: 15, maximum: 240, default: 60 })
  @IsOptional() @IsInt() @Min(15) @Max(240)
  durationMinutes?: number;

  @ApiPropertyOptional({ example: 'Dolor lumbar crónico con irradiación.' })
  @IsOptional() @IsString() @MaxLength(500)
  motivo?: string;

  @ApiPropertyOptional({ example: 'Traer estudios previos de columna.' })
  @IsOptional() @IsString() @MaxLength(1000)
  notas?: string;
}
