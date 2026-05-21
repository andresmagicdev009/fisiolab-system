import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { TipoSesion } from '../entities/session.entity';

export class CreateSessionDto {
  @ApiProperty({ enum: TipoSesion, example: TipoSesion.FISIOTERAPIA })
  @IsEnum(TipoSesion)
  tipo!: TipoSesion;

  @ApiProperty({ example: '2024-03-20', description: 'YYYY-MM-DD — no puede ser futura' })
  @IsDateString()
  fechaSesion!: string;

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f01234567890' })
  @IsUUID()
  profesionalId!: string;

  @ApiPropertyOptional({ example: 'c3d4e5f6-a7b8-9012-cdef-012345678901', description: 'Cita SEGUIMIENTO del mismo paciente' })
  @IsOptional() @IsUUID()
  appointmentId?: string;

  @ApiPropertyOptional({ example: 'Sesión de fortalecimiento post-operatorio.' })
  @IsOptional() @IsString() @MaxLength(500)
  observaciones?: string;
}
