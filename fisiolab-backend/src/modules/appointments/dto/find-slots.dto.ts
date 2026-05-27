import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { AppointmentBookingType } from '../entities/appointment.entity';

export class FindSlotsDto {
  @ApiPropertyOptional({ example: 'c3d4e5f6-a7b8-9012-cdef-012345678901', description: 'UUID del profesional. Omitir = todos.' })
  @IsOptional() @IsUUID()
  professionalId?: string;

  @ApiProperty({ example: '2026-05-24', description: 'Fecha inicio del rango YYYY-MM-DD' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2026-05-30', description: 'Fecha fin del rango YYYY-MM-DD' })
  @IsDateString()
  endDate!: string;

  @ApiProperty({ enum: AppointmentBookingType, description: 'SDA = solo hoy | PRE_BOOK = desde mañana | EMERGENCIA = cualquier fecha' })
  @IsEnum(AppointmentBookingType)
  bookingType!: AppointmentBookingType;

  @ApiPropertyOptional({ example: 30, minimum: 15, maximum: 120, description: 'Duración deseada en minutos. Por defecto usa slotDurationMinutes de la disponibilidad.' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(15) @Max(120)
  duracion?: number;
}

export interface SlotDto {
  professionalId: string;
  fecha: string;
  hora: string;
  duracion: number;
  disponible: boolean;
  ocupados: number;
  capacidad: number;
  cupoDisponible: number;
}
