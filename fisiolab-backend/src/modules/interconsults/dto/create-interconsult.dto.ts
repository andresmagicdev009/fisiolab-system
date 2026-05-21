import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateInterconsultDto {
  @ApiProperty({ example: 'c3d4e5f6-a7b8-9012-cdef-012345678901', description: 'UUID del profesional destinatario' })
  @IsUUID()
  destinatarioId!: string;

  @ApiProperty({ example: 'Evaluación neurológica por radiculopatía L4-L5 refractaria a tratamiento.' })
  @IsString() @MinLength(10) @MaxLength(1000)
  motivo!: string;

  @ApiPropertyOptional({ example: 'ROM lumbar: flexión 40°. Lasègue (+) 30° derecho.' })
  @IsOptional() @IsString() @MaxLength(2000)
  hallazgosRelevantes?: string;

  @ApiPropertyOptional({ example: '¿Existe componente discal que requiera manejo quirúrgico?' })
  @IsOptional() @IsString() @MaxLength(500)
  preguntaClinica?: string;

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f01234567890', description: 'UUID del profesional solicitante' })
  @IsUUID()
  solicitanteId!: string;
}
