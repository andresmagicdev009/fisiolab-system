import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateHeredofamiliarDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() diabetes?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) diabetesFamiliar?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() diabetesNotas?: string | null;

  @ApiPropertyOptional() @IsOptional() @IsBoolean() hipertension?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) hipertensionFamiliar?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() hipertensionNotas?: string | null;

  @ApiPropertyOptional() @IsOptional() @IsBoolean() cardiopatias?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) cardiopatiasFamiliar?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() cardiopatiasNotas?: string | null;

  @ApiPropertyOptional() @IsOptional() @IsBoolean() cancer?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() cancerTipo?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) cancerFamiliar?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() cancerNotas?: string | null;

  @ApiPropertyOptional() @IsOptional() @IsBoolean() enfermedadesRespiratorias?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() enfermedadesRespiratoriasTipo?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) enfermedadesRespiratoriasFamiliar?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() enfermedadesRespiratoriastNotas?: string | null;

  @ApiPropertyOptional() @IsOptional() @IsBoolean() enfermedadesRenales?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) enfermedadesRenalesFamiliar?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() enfermedadesRenalesNotas?: string | null;

  @ApiPropertyOptional() @IsOptional() @IsBoolean() enfermedadesNeurologicas?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() enfermedadesNeurologicasTipo?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) enfermedadesNeurologicasFamiliar?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() enfermedadesNeurologicasNotas?: string | null;

  @ApiPropertyOptional() @IsOptional() @IsBoolean() enfermedadesMentales?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() enfermedadesMentalesTipo?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) enfermedadesMentalesFamiliar?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() enfermedadesMentalesNotas?: string | null;

  @ApiPropertyOptional({ type: 'array' }) @IsOptional() @IsArray() otros?: object[] | null;
}
