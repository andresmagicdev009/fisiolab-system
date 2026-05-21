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
import { FormaFarmaceutica, ViaAdministracion } from '../entities/medication.entity';

export class CreateMedicationDto {
  @ApiProperty({ example: 'Ibuprofeno' })
  @IsString() @MinLength(2) @MaxLength(255)
  principioActivo!: string;

  @ApiPropertyOptional({ example: 'Advil' })
  @IsOptional() @IsString() @MaxLength(255)
  nombreComercial?: string;

  @ApiPropertyOptional({ example: '400mg' })
  @IsOptional() @IsString() @MaxLength(100)
  concentracion?: string;

  @ApiPropertyOptional({ enum: FormaFarmaceutica })
  @IsOptional() @IsEnum(FormaFarmaceutica)
  formaFarmaceutica?: FormaFarmaceutica;

  @ApiPropertyOptional({ example: '1 tableta' })
  @IsOptional() @IsString() @MaxLength(100)
  dosis?: string;

  @ApiPropertyOptional({ enum: ViaAdministracion, default: ViaAdministracion.ORAL })
  @IsOptional() @IsEnum(ViaAdministracion)
  viaAdministracion?: ViaAdministracion;

  @ApiPropertyOptional({ example: 'Cada 8 horas' })
  @IsOptional() @IsString() @MaxLength(100)
  frecuencia?: string;

  @ApiPropertyOptional({ example: 5, minimum: 1, maximum: 365 })
  @IsOptional() @IsInt() @Min(1) @Max(365)
  duracionDias?: number;

  @ApiPropertyOptional({ example: 'Tomar con alimentos.' })
  @IsOptional() @IsString() @MaxLength(1000)
  indicaciones?: string;

  @ApiPropertyOptional({ example: 1, description: 'Posición en receta (auto-asignado si omitido)' })
  @IsOptional() @IsInt() @Min(1)
  orden?: number;
}
