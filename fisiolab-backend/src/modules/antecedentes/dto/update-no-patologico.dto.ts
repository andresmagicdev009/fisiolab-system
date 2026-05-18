import { Type } from 'class-transformer';
import {
  IsArray, IsBoolean, IsEnum,
  IsInt, IsNumber, IsOptional, IsString, Min,
} from 'class-validator';
import {
  ActividadFisicaFrecuencia,
  ActividadFisicaIntensidad,
  AlcoholismoFrecuencia,
  AlimentacionTipo,
  CalidadSueno,
  TabaquismoTipo,
  TipoVivienda,
} from '../entities/antecedentes-no-patologico.entity';

export class UpdateNoPatologicoDto {
  @IsOptional() @IsBoolean() tabaquismo?: boolean;
  @IsOptional() @IsEnum(TabaquismoTipo) tabaquismoTipo?: TabaquismoTipo | null;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) tabaquismoCigarrillosDia?: number | null;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) tabaquismoAniosFumando?: number | null;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) tabaquismoAniosSinFumar?: number | null;

  @IsOptional() @IsBoolean() alcoholismo?: boolean;
  @IsOptional() @IsEnum(AlcoholismoFrecuencia) alcoholismoFrecuencia?: AlcoholismoFrecuencia | null;
  @IsOptional() @IsString() alcoholismoCantidad?: string | null;
  @IsOptional() @IsString() alcoholismoTipo?: string | null;

  @IsOptional() @IsBoolean() drogas?: boolean;
  @IsOptional() @IsString() drogasTipo?: string | null;
  @IsOptional() @IsString() drogasFrecuencia?: string | null;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) drogasAniosConsumo?: number | null;

  @IsOptional() @IsBoolean() cafe?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) cafeTazasDia?: number | null;

  @IsOptional() @IsBoolean() actividadFisica?: boolean;
  @IsOptional() @IsString() actividadFisicaTipo?: string | null;
  @IsOptional() @IsEnum(ActividadFisicaFrecuencia) actividadFisicaFrecuencia?: ActividadFisicaFrecuencia | null;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) actividadFisicaDuracionMinutos?: number | null;
  @IsOptional() @IsEnum(ActividadFisicaIntensidad) actividadFisicaIntensidad?: ActividadFisicaIntensidad | null;

  @IsOptional() @IsEnum(AlimentacionTipo) alimentacionTipo?: AlimentacionTipo | null;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) alimentacionComidasDia?: number;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) alimentacionHidratacionLitros?: number | null;
  @IsOptional() @IsString() alimentacionNotas?: string | null;

  @IsOptional() @Type(() => Number) @IsNumber() horasSuenoPromedio?: number | null;
  @IsOptional() @IsEnum(CalidadSueno) calidadSueno?: CalidadSueno | null;
  @IsOptional() @IsBoolean() trastornosSueno?: boolean;
  @IsOptional() @IsString() trastornosSuenoTipo?: string | null;

  @IsOptional() @IsEnum(TipoVivienda) tipoVivienda?: TipoVivienda | null;
  @IsOptional() serviciosBasicos?: object | null;
  @IsOptional() @IsBoolean() hacinamiento?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) numeroPersonasHogar?: number | null;

  @IsOptional() @IsBoolean() animalesDomesticos?: boolean;
  @IsOptional() @IsString() animalesTipo?: string | null;

  @IsOptional() @IsBoolean() exposicionQuimicos?: boolean;
  @IsOptional() @IsString() exposicionQuimicosTipo?: string | null;
  @IsOptional() @IsBoolean() exposicionRadiacion?: boolean;
  @IsOptional() @IsString() exposicionRadiacionTipo?: string | null;
  @IsOptional() @IsBoolean() exposicionRuido?: boolean;
  @IsOptional() @IsBoolean() trabajoForzado?: boolean;
  @IsOptional() @IsBoolean() trabajoTurnosRotativos?: boolean;

  @IsOptional() @IsArray() viajesRecientes?: object[] | null;
  @IsOptional() @IsBoolean() esquemaVacunacionCompleto?: boolean | null;
  @IsOptional() @IsArray() vacunas?: object[] | null;
  @IsOptional() @IsString() otrosHabitos?: string | null;
}
