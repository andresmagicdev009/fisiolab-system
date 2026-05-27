import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { TipoCita } from '../entities/appointment.entity';
import { WaitingListPriority } from '../entities/waiting-list.entity';

export class CreateWaitingListDto {
  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f01234567890' })
  @IsUUID()
  patientId!: string;

  @ApiProperty({ enum: TipoCita })
  @IsEnum(TipoCita)
  tipoCitaSolicitado!: TipoCita;

  @ApiProperty({ example: '2026-05-28', description: 'Fecha deseada YYYY-MM-DD' })
  @IsDateString()
  fechaDeseada!: string;

  @ApiPropertyOptional({ example: 'c3d4e5f6-a7b8-9012-cdef-012345678901', description: 'Profesional preferido (opcional)' })
  @IsOptional() @IsUUID()
  preferredProfessionalId?: string;

  @ApiPropertyOptional({ enum: WaitingListPriority, default: WaitingListPriority.NORMAL })
  @IsOptional() @IsEnum(WaitingListPriority)
  prioridad?: WaitingListPriority;

  @ApiPropertyOptional({ example: 'Dolor lumbar recurrente', maxLength: 500 })
  @IsOptional() @IsString() @MaxLength(500)
  motivoConsulta?: string;
}
