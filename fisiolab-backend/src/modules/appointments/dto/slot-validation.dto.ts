import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class ProposedSlotDto {
  @ApiProperty({ example: '2026-05-26', description: 'Fecha YYYY-MM-DD' })
  @IsDateString()
  fecha!: string;

  @ApiProperty({ example: '09:00', description: 'Hora HH:mm' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'hora debe ser HH:mm' })
  hora!: string;

  @ApiProperty({ example: 60, minimum: 15, maximum: 180 })
  @IsInt()
  @Min(15)
  @Max(180)
  duracion!: number;
}

export class ValidateScheduleDto {
  @ApiProperty({ example: 'c3d4e5f6-a7b8-9012-cdef-012345678901' })
  @IsUUID()
  professionalId!: string;

  @ApiProperty({ type: [ProposedSlotDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProposedSlotDto)
  proposedSlots!: ProposedSlotDto[];
}

export interface FreeSlotInfo {
  hora: string;
  cupoDisponible: number;
}

export interface SlotValidationResult {
  fecha: string;
  hora: string;
  disponible: boolean;
  ocupados: number;
  capacidad: number;
  cupoDisponible: number;
  suggestedSlots?: FreeSlotInfo[];
}

export interface ValidateScheduleResponseDto {
  results: SlotValidationResult[];
  allValid: boolean;
}
