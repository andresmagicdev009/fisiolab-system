import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class UpdateAvailabilityDto {
  @ApiPropertyOptional({ example: '09:00' })
  @IsOptional() @Matches(/^\d{2}:\d{2}$/, { message: 'startTime debe ser HH:MM' })
  startTime?: string;

  @ApiPropertyOptional({ example: '17:00' })
  @IsOptional() @Matches(/^\d{2}:\d{2}$/, { message: 'endTime debe ser HH:MM' })
  endTime?: string;

  @ApiPropertyOptional({ minimum: 15, maximum: 120 })
  @IsOptional() @IsInt() @Min(15) @Max(120)
  slotDurationMinutes?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 60 })
  @IsOptional() @IsInt() @Min(0) @Max(60)
  breakDurationMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsDateString()
  effectiveFrom?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsDateString()
  effectiveUntil?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsBoolean()
  isActive?: boolean;
}
