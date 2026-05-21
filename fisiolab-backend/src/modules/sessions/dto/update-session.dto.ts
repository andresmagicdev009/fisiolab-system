import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { EstadoSesion } from '../entities/session.entity';

const TRANSICIONABLE = [EstadoSesion.EN_CURSO, EstadoSesion.COMPLETADA, EstadoSesion.CANCELADA];

export class UpdateSessionDto {
  @ApiPropertyOptional({ example: '2024-03-22' })
  @IsOptional() @IsDateString()
  fechaSesion?: string;

  @ApiPropertyOptional({ example: 'b2c3d4e5-f6a7-8901-bcde-f01234567890' })
  @IsOptional() @IsUUID()
  profesionalId?: string;

  @ApiPropertyOptional({
    enum: TRANSICIONABLE,
    description: 'COMPLETADA requiere estado previo EN_CURSO. No se puede volver a PROGRAMADA.',
  })
  @IsOptional() @IsEnum(TRANSICIONABLE)
  estado?: EstadoSesion.EN_CURSO | EstadoSesion.COMPLETADA | EstadoSesion.CANCELADA;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(500)
  observaciones?: string;
}
