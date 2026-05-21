import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class UpdateInterconsultDto {
  @ApiPropertyOptional({ example: 'c3d4e5f6-a7b8-9012-cdef-012345678901' })
  @IsOptional() @IsUUID()
  destinatarioId?: string;

  @ApiPropertyOptional({ example: 'Evaluación neurológica por radiculopatía.' })
  @IsOptional() @IsString() @MinLength(10) @MaxLength(1000)
  motivo?: string;

  @ApiPropertyOptional({ example: 'ROM lumbar: flexión 40°.' })
  @IsOptional() @IsString() @MaxLength(2000)
  hallazgosRelevantes?: string;

  @ApiPropertyOptional({ example: '¿Existe componente discal?' })
  @IsOptional() @IsString() @MaxLength(500)
  preguntaClinica?: string;
}
