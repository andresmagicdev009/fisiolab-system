import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { TipoEjercicio } from '../entities/exercise.entity';

export class CreateExerciseDto {
  @ApiProperty({ enum: TipoEjercicio, default: TipoEjercicio.REPETICIONES })
  @IsOptional()
  @IsEnum(TipoEjercicio)
  tipoEjercicio?: TipoEjercicio = TipoEjercicio.REPETICIONES;

  @ApiProperty({ example: 'Puente glúteo' })
  @IsString() @MinLength(2) @MaxLength(255)
  nombre!: string;

  @ApiPropertyOptional({ example: 'Decúbito supino, elevar pelvis contrayendo glúteos.' })
  @IsOptional() @IsString() @MaxLength(2000)
  descripcion?: string;

  @ApiPropertyOptional({ example: 3, minimum: 1, maximum: 20 })
  @IsOptional() @IsInt() @Min(1) @Max(20)
  series?: number;

  @ApiPropertyOptional({ example: 15, minimum: 1, maximum: 100 })
  @IsOptional() @IsInt() @Min(1) @Max(100)
  repeticiones?: number;

  @ApiPropertyOptional({ example: 30, minimum: 1, maximum: 3600, description: 'Duración en segundos' })
  @IsOptional() @IsInt() @Min(1) @Max(3600)
  duracionSegundos?: number;

  @ApiPropertyOptional({ example: 'Mantener espalda plana. No hiperlordosis.' })
  @IsOptional() @IsString() @MaxLength(500)
  observaciones?: string;
}
