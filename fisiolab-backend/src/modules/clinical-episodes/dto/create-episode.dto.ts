import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateEpisodeDto {
  @ApiProperty({ example: 'Dolor lumbar crónico con irradiación a miembro inferior derecho' })
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  motivoConsulta!: string;

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f01234567890' })
  @IsUUID()
  profesionalId!: string;

  @ApiPropertyOptional({ example: 'Paciente refiere 3 semanas de evolución. EVA 7/10.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notaApertura?: string;

  @ApiPropertyOptional({ example: 'e5f6a7b8-c9d0-1234-ef01-234567890123' })
  @IsOptional()
  @IsUUID()
  appointmentId?: string;
}
