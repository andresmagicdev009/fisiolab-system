import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DayOfWeek } from '../entities/availability.entity';

export class SlotInputDto {
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

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional() @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'America/Guayaquil', default: 'America/Guayaquil' })
  @IsOptional() @IsString()
  zonaHoraria?: string;
}

export class BatchReplaceAvailabilityDto {
  @ApiProperty({
    type: [SlotInputDto],
    description: 'Reemplaza TODA la disponibilidad semanal del profesional. Array vacío = borrar todo.',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SlotInputDto)
  slots!: SlotInputDto[];
}
