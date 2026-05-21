import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class PruebaEspecificaDto {
  @ApiProperty({ enum: ['positivo', 'negativo', 'dudoso'] })
  @IsIn(['positivo', 'negativo', 'dudoso'])
  resultado!: 'positivo' | 'negativo' | 'dudoso';

  @ApiPropertyOptional({ example: 'A 45 grados' })
  @IsOptional() @IsString() @MaxLength(200)
  notas?: string;
}

export class CreateEvaluationDto {
  @ApiProperty({ example: '2024-03-20' })
  @IsDateString()
  fechaEvaluacion!: string;

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f01234567890' })
  @IsUUID()
  profesionalId!: string;

  @ApiPropertyOptional({
    example: { hombroFlexionD: 120, hombroExtensionD: 50 },
    description: 'Grados por segmento y movimiento — clave libre',
  })
  @IsOptional() @IsObject()
  rangoMovimiento?: Record<string, number>;

  @ApiPropertyOptional({
    example: { deltoidesD: 4, bicepsD: 5 },
    description: 'Escala MRC 0-5 por músculo',
  })
  @IsOptional() @IsObject()
  fuerzaMuscular?: Record<string, number>;

  @ApiPropertyOptional({ example: 6, minimum: 0, maximum: 10 })
  @IsOptional() @IsInt() @Min(0) @Max(10)
  escalaDolor?: number;

  @ApiPropertyOptional({
    example: { laségue: { resultado: 'positivo', notas: 'a 45°' } },
    description: 'Pruebas clínicas específicas',
  })
  @IsOptional() @IsObject()
  pruebasEspecificas?: Record<string, PruebaEspecificaDto>;

  @ApiPropertyOptional({ example: 'Postura antálgica. Escoliosis funcional leve.' })
  @IsOptional() @IsString() @MaxLength(2000)
  inspeccion?: string;

  @ApiPropertyOptional({ example: 'Dolor a palpación L4-L5.' })
  @IsOptional() @IsString() @MaxLength(2000)
  palpacion?: string;

  @ApiPropertyOptional({ example: 'Síndrome doloroso lumbar crónico con limitación funcional moderada.' })
  @IsOptional() @IsString() @MaxLength(1000)
  diagnostico?: string;

  @ApiPropertyOptional({ example: 'Paciente colaborador.' })
  @IsOptional() @IsString() @MaxLength(1000)
  observaciones?: string;
}
