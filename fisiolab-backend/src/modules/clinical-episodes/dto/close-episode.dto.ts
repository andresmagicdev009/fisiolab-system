import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CloseEpisodeDto {
  @ApiProperty({ example: 'Alta por mejoría clínica. EVA 2/10. Paciente tolera actividades cotidianas sin dolor significativo.' })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  notaCierre!: string;

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
}
