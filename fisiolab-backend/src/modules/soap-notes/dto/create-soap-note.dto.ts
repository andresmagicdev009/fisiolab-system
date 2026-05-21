import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class SignosVitalesDto {
  @ApiPropertyOptional({ example: '120/80' })
  @IsOptional() @IsString() @MaxLength(10)
  ta?: string;

  @ApiPropertyOptional({ example: 72 })
  @IsOptional() @IsInt() @Min(20) @Max(300)
  fc?: number;

  @ApiPropertyOptional({ example: 16 })
  @IsOptional() @IsInt() @Min(5) @Max(60)
  fr?: number;

  @ApiPropertyOptional({ example: 36.5 })
  @IsOptional() @IsNumber() @Min(30) @Max(43)
  temperatura?: number;

  @ApiPropertyOptional({ example: 98 })
  @IsOptional() @IsInt() @Min(50) @Max(100)
  spo2?: number;

  @ApiPropertyOptional({ example: 70.5 })
  @IsOptional() @IsNumber() @Min(1) @Max(300)
  peso?: number;

  @ApiPropertyOptional({ example: 1.72 })
  @IsOptional() @IsNumber() @Min(0.3) @Max(2.5)
  talla?: number;
}

export class SoapSDto {
  @ApiProperty({ example: 'Refiere mejoría del 30%. Aún con dolor nocturno.' })
  @IsString() @MinLength(5) @MaxLength(500)
  motivoSesion!: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional() @IsInt() @Min(0) @Max(10)
  evaDolor?: number;

  @ApiPropertyOptional({ example: 'Hormigueo en cara lateral del pie derecho' })
  @IsOptional() @IsString() @MaxLength(500)
  sintomasReferidos?: string;
}

export class SoapODto {
  @ApiPropertyOptional({ type: () => SignosVitalesDto })
  @IsOptional() @ValidateNested() @Type(() => SignosVitalesDto)
  signosVitales?: SignosVitalesDto;

  @ApiPropertyOptional({ example: 'Limitación flexión lumbar 60°. Lasègue (+) a 45° derecho.' })
  @IsOptional() @IsString() @MaxLength(2000)
  hallazgosExamenFisico?: string;

  @ApiPropertyOptional({ example: 'Flexión L: 60°, Extensión: 20°' })
  @IsOptional() @IsString() @MaxLength(1000)
  rangoMovimiento?: string;

  @ApiPropertyOptional({ example: 'Glúteo mayor 4/5 bilateral' })
  @IsOptional() @IsString() @MaxLength(500)
  fuerzaMuscular?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(1000)
  otrosHallazgos?: string;
}

export class SoapADto {
  @ApiPropertyOptional({ example: 'Síndrome radicular L4-L5 en fase subaguda con mejoría' })
  @IsOptional() @IsString() @MaxLength(500)
  diagnosticoFisioterapeutico?: string;

  @ApiPropertyOptional({ example: 'Aumento ROM flexión lumbar de 45° a 60°.' })
  @IsOptional() @IsString() @MaxLength(500)
  progresoVsAnterior?: string;

  @ApiPropertyOptional({ example: 'Buena tolerancia a tracción lumbar.' })
  @IsOptional() @IsString() @MaxLength(500)
  respuestaTratamiento?: string;
}

export class SoapPDto {
  @ApiPropertyOptional({ example: 'Tracción lumbar mecánica 20min, TENS 15min' })
  @IsOptional() @IsString() @MaxLength(1000)
  tecnicasAplicadas?: string;

  @ApiPropertyOptional({ example: 'Williams modificado x10 reps, Puente glúteo x15 reps' })
  @IsOptional() @IsString() @MaxLength(1000)
  ejerciciosIndicados?: string;

  @ApiPropertyOptional({ example: 'Alcanzar flexión 75°, reducir EVA a 3' })
  @IsOptional() @IsString() @MaxLength(500)
  objetivosProximaSesion?: string;

  @ApiPropertyOptional({ example: '2024-03-22' })
  @IsOptional() @IsDateString()
  fechaProximaSesion?: string;
}

export class CreateSoapNoteDto {
  @ApiProperty({ example: '2024-03-20' })
  @IsDateString()
  fechaSesion!: string;

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f01234567890' })
  @IsUUID()
  profesionalId!: string;

  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', description: 'UUID de sesión FISIOTERAPIA del mismo episodio' })
  @IsOptional() @IsUUID()
  sessionId?: string;

  @ApiProperty({ type: () => SoapSDto })
  @ValidateNested() @Type(() => SoapSDto)
  subjetivo!: SoapSDto;

  @ApiProperty({ type: () => SoapODto })
  @ValidateNested() @Type(() => SoapODto)
  objetivo!: SoapODto;

  @ApiPropertyOptional({ type: () => SoapADto })
  @IsOptional() @ValidateNested() @Type(() => SoapADto)
  analisis?: SoapADto;

  @ApiPropertyOptional({ type: () => SoapPDto })
  @IsOptional() @ValidateNested() @Type(() => SoapPDto)
  plan?: SoapPDto;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(1000)
  observaciones?: string;
}
