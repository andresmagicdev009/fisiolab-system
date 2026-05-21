import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { EstadoTarjetero } from '../entities/tarjetero-indice.entity';

export class UpdateTarjeteroDto {
  @ApiPropertyOptional({ example: 'b2c3d4e5-f6a7-8901-bcde-f01234567890' })
  @IsOptional()
  @IsUUID()
  medicoResponsableId?: string;

  @ApiPropertyOptional({ enum: EstadoTarjetero, example: EstadoTarjetero.INACTIVO })
  @IsOptional()
  @IsEnum(EstadoTarjetero)
  estado?: EstadoTarjetero;

  @ApiPropertyOptional({ example: 'Paciente fuera del país temporalmente' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observaciones?: string;
}
