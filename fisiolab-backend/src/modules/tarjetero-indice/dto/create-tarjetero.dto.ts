import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateTarjeteroDto {
  @ApiPropertyOptional({ example: 'b2c3d4e5-f6a7-8901-bcde-f01234567890' })
  @IsOptional()
  @IsUUID()
  medicoResponsableId?: string;

  @ApiPropertyOptional({ example: 'Paciente referido por Dr. Ramírez' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observaciones?: string;
}
