import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray, IsBoolean, IsDateString, IsEnum,
  IsInt, IsOptional, IsString, Min,
} from 'class-validator';
import {
  AcvTipo,
  Covid19Severidad,
  DiabetesTipo,
  HepatitisTipo,
} from '../entities/antecedentes-patologico.entity';

export class UpdatePatologicoDto {
  @IsOptional() @IsBoolean() diabetesMellitus?: boolean;
  @IsOptional() @IsEnum(DiabetesTipo) diabetesTipo?: DiabetesTipo | null;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1900) diabetesAnioDiagnostico?: number | null;
  @IsOptional() @IsString() diabetesTratamiento?: string | null;
  @IsOptional() @IsBoolean() diabetesControlada?: boolean | null;

  @IsOptional() @IsBoolean() hipertensionArterial?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1900) hipertensionAnioDiagnostico?: number | null;
  @IsOptional() @IsString() hipertensionTratamiento?: string | null;
  @IsOptional() @IsBoolean() hipertensionControlada?: boolean | null;

  @IsOptional() @IsBoolean() cardiopatias?: boolean;
  @IsOptional() @IsString() cardiopatiasTipo?: string | null;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1900) cardiopatiasAnioDiagnostico?: number | null;
  @IsOptional() @IsString() cardiopatiasTratamiento?: string | null;

  @IsOptional() @IsBoolean() enfermedadesRespiratorias?: boolean;
  @IsOptional() @IsString() enfermedadesRespiratoriasTipo?: string | null;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1900) enfermedadesRespiratoriasAnioDiagnostico?: number | null;
  @IsOptional() @IsString() enfermedadesRespiratoriasTratamiento?: string | null;

  @IsOptional() @IsBoolean() enfermedadesRenales?: boolean;
  @IsOptional() @IsString() enfermedadesRenalesTipo?: string | null;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1900) enfermedadesRenalesAnioDiagnostico?: number | null;
  @IsOptional() @IsString() enfermedadesRenalesTratamiento?: string | null;

  @IsOptional() @IsBoolean() cancer?: boolean;
  @IsOptional() @IsString() cancerTipo?: string | null;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1900) cancerAnioDiagnostico?: number | null;
  @IsOptional() @IsString() cancerTratamiento?: string | null;
  @IsOptional() @IsBoolean() cancerRemision?: boolean | null;

  @IsOptional() @IsBoolean() tuberculosis?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1900) tuberculosisAnio?: number | null;
  @IsOptional() @IsBoolean() tuberculosisTratamientoCompleto?: boolean | null;

  @IsOptional() @IsBoolean() hepatitis?: boolean;
  @IsOptional() @IsEnum(HepatitisTipo) hepatitisTipo?: HepatitisTipo | null;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1900) hepatitisAnio?: number | null;

  @IsOptional() @IsBoolean() vihSida?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1900) vihAnioDiagnostico?: number | null;
  @IsOptional() @IsBoolean() vihTratamientoAntirretroviral?: boolean | null;

  @IsOptional() @IsBoolean() covid19?: boolean;
  @IsOptional() @IsDateString() covid19Fecha?: string | null;
  @IsOptional() @IsEnum(Covid19Severidad) covid19Severidad?: Covid19Severidad | null;
  @IsOptional() @IsString() covid19Secuelas?: string | null;

  @IsOptional() @IsBoolean() epilepsia?: boolean;
  @IsOptional() @IsBoolean() epilepsiaControlada?: boolean | null;
  @IsOptional() @IsString() epilepsiaTratamiento?: string | null;

  @IsOptional() @IsBoolean() accidenteCerebrovascular?: boolean;
  @IsOptional() @IsDateString() acvFecha?: string | null;
  @IsOptional() @IsEnum(AcvTipo) acvTipo?: AcvTipo | null;
  @IsOptional() @IsString() acvSecuelas?: string | null;

  @IsOptional() @IsBoolean() depresion?: boolean;
  @IsOptional() @IsString() depresionTratamiento?: string | null;
  @IsOptional() @IsBoolean() ansiedad?: boolean;
  @IsOptional() @IsString() ansiedadTratamiento?: string | null;
  @IsOptional() @IsArray() otrosPsiquiatricos?: object[] | null;

  @IsOptional() @IsArray() cirugias?: object[] | null;
  @IsOptional() @IsArray() hospitalizaciones?: object[] | null;
  @IsOptional() @IsArray() traumatismos?: object[] | null;
  @IsOptional() @IsArray() alergiasMedicamentos?: object[] | null;
  @IsOptional() @IsArray() alergiasAlimentos?: object[] | null;
  @IsOptional() @IsArray() alergiasOtras?: object[] | null;

  @IsOptional() @IsBoolean() transfusiones?: boolean;
  @IsOptional() @IsArray() transfusionesDetalle?: object[] | null;
  @IsOptional() @IsArray() otros?: object[] | null;
}

