import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { DayOfWeek } from '../entities/availability.entity';

export class CreateAvailabilityDto {
  @ApiProperty({ example: 'c3d4e5f6-a7b8-9012-cdef-012345678901' })
  @IsUUID()
  professionalId!: string;

  @ApiProperty({ enum: DayOfWeek, example: DayOfWeek.MONDAY })
  @IsEnum(DayOfWeek)
  dayOfWeek!: DayOfWeek;

  @ApiProperty({ example: '09:00', description: 'Hora inicio HH:MM (24h)' })
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime debe ser HH:MM' })
  startTime!: string;

  @ApiProperty({ example: '17:00', description: 'Hora fin HH:MM (24h)' })
  @Matches(/^\d{2}:\d{2}$/, { message: 'endTime debe ser HH:MM' })
  endTime!: string;

  @ApiPropertyOptional({ example: 30, minimum: 15, maximum: 120, default: 30 })
  @IsOptional() @IsInt() @Min(15) @Max(120)
  slotDurationMinutes?: number;

  @ApiPropertyOptional({ example: 0, minimum: 0, maximum: 60, default: 0 })
  @IsOptional() @IsInt() @Min(0) @Max(60)
  breakDurationMinutes?: number;

  @ApiPropertyOptional({ example: '2026-01-01', description: 'Vigencia desde (YYYY-MM-DD)' })
  @IsOptional() @IsDateString()
  effectiveFrom?: string;

  @ApiPropertyOptional({ example: '2026-12-31', description: 'Vigencia hasta (YYYY-MM-DD)' })
  @IsOptional() @IsDateString()
  effectiveUntil?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional() @IsBoolean()
  isActive?: boolean;
}
