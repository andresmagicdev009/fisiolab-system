import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotIn, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { EstadoEpisodio } from '../entities/clinical-episode.entity';

export class UpdateEpisodeDto {
  @ApiPropertyOptional({ example: 'Dolor lumbar crónico con irradiación a miembro inferior derecho' })
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  motivoConsulta?: string;

  @ApiPropertyOptional({ example: 'b2c3d4e5-f6a7-8901-bcde-f01234567890' })
  @IsOptional()
  @IsUUID()
  profesionalId?: string;

  @ApiPropertyOptional({ example: 'Lumbalgia mecánica con radiculopatía L4-L5' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  diagnosticoPrincipal?: string;

  @ApiPropertyOptional({ example: 'M51.1' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  codigoCie10?: string;

  @ApiPropertyOptional({ example: 'HTA controlada' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  diagnosticoSecundario?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notaApertura?: string;

  @ApiPropertyOptional({ enum: EstadoEpisodio })
  @IsOptional()
  @IsEnum(EstadoEpisodio)
  @IsNotIn([EstadoEpisodio.CERRADO], { message: 'Para cerrar un episodio, utilice el endpoint correspondiente' })
  estado?: EstadoEpisodio;
}
