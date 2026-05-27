import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { DayOfWeek } from '../entities/availability.entity';

export class WeeklyTimeRangeDto {
  @ApiProperty({ example: '09:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'inicio debe ser HH:mm' })
  inicio!: string;

  @ApiProperty({ example: '17:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'fin debe ser HH:mm' })
  fin!: string;
}

export class WeeklyDayConfigDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  disponible!: boolean;

  @ApiProperty({ type: [WeeklyTimeRangeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WeeklyTimeRangeDto)
  franjas!: WeeklyTimeRangeDto[];
}

export class WeeklyScheduleConfigDto {
  @ApiProperty({ example: 'semanal' })
  @IsString()
  repeticion!: 'semanal';

  @ApiProperty({ example: 'America/Guayaquil' })
  @IsString()
  zonaHoraria!: string;

  @ApiProperty({ type: WeeklyDayConfigDto })
  @ValidateNested() @Type(() => WeeklyDayConfigDto) monday!: WeeklyDayConfigDto;

  @ApiProperty({ type: WeeklyDayConfigDto })
  @ValidateNested() @Type(() => WeeklyDayConfigDto) tuesday!: WeeklyDayConfigDto;

  @ApiProperty({ type: WeeklyDayConfigDto })
  @ValidateNested() @Type(() => WeeklyDayConfigDto) wednesday!: WeeklyDayConfigDto;

  @ApiProperty({ type: WeeklyDayConfigDto })
  @ValidateNested() @Type(() => WeeklyDayConfigDto) thursday!: WeeklyDayConfigDto;

  @ApiProperty({ type: WeeklyDayConfigDto })
  @ValidateNested() @Type(() => WeeklyDayConfigDto) friday!: WeeklyDayConfigDto;

  @ApiProperty({ type: WeeklyDayConfigDto })
  @ValidateNested() @Type(() => WeeklyDayConfigDto) saturday!: WeeklyDayConfigDto;

  @ApiProperty({ type: WeeklyDayConfigDto })
  @ValidateNested() @Type(() => WeeklyDayConfigDto) sunday!: WeeklyDayConfigDto;
}

export class SessionOverrideDto {
  @ApiProperty({ example: 3, minimum: 1 })
  @IsInt() @Min(1)
  sessionIndex!: number;

  @ApiProperty({ example: '2026-05-29' })
  @IsDateString()
  fecha!: string;

  @ApiProperty({ example: '10:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  hora!: string;
}

export class CreatePlanWithScheduleDto {
  @ApiProperty({ example: 'Rehabilitación esguince hombro derecho' })
  @IsString() @IsNotEmpty() @Length(3, 200)
  titulo!: string;

  @ApiProperty({ example: 6, minimum: 1, maximum: 60 })
  @IsInt() @Min(1) @Max(60)
  numeroSesiones!: number;

  @ApiProperty({ example: 60, minimum: 15, maximum: 180 })
  @IsInt() @Min(15) @Max(180)
  duracionMinutos!: number;

  @ApiProperty({ example: 'c3d4e5f6-a7b8-9012-cdef-012345678901' })
  @IsUUID()
  professionalId!: string;

  @ApiProperty({ example: '2026-05-26' })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional({ example: 1, minimum: 1, maximum: 8, default: 1 })
  @IsOptional() @IsInt() @Min(1) @Max(8)
  maxSesionesPorDia?: number;

  @ApiProperty({ type: WeeklyScheduleConfigDto })
  @ValidateNested() @Type(() => WeeklyScheduleConfigDto)
  weeklySchedule!: WeeklyScheduleConfigDto;

  @ApiPropertyOptional({ type: [SessionOverrideDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SessionOverrideDto)
  overrides?: SessionOverrideDto[];

  @ApiPropertyOptional({ example: 'Iniciar con cadena cinética cerrada.' })
  @IsOptional() @IsString() @Length(1, 1000)
  observaciones?: string;
}

export interface SlotPropuesto {
  sessionIndex: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  editado: boolean;
}

export const DAY_KEYS: DayOfWeek[] = [
  DayOfWeek.SUNDAY,
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
];
