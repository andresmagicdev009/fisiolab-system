import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ReopenEpisodeDto {
  @ApiProperty({ example: 'Reapertura por persistencia de síntomas. Paciente refiere dolor lumbar con irradiación a miembro inferior derecho, EVA 6/10.' })
  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  motivoReapertura!: string;
}
