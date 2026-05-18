import { Type } from 'class-transformer';
import {
  IsArray, IsBoolean, IsDateString,
  IsEnum, IsInt, IsOptional, IsString, Min,
} from 'class-validator';
import {
  CitologiaResultado,
  DismenorreaIntensidad,
  MenstruacionCantidad,
} from '../entities/antecedentes-gineco.entity';

export class UpdateGinecoDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(8) menarcaEdad?: number | null;
  @IsOptional() @IsDateString() fechaUltimaMenstruacion?: string | null;
  @IsOptional() @IsBoolean() cicloMenstrualRegular?: boolean | null;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) cicloMenstrualDuracionDias?: number;
  @IsOptional() @IsString() cicloMenstrualNotas?: string | null;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) menstruacionDuracionDias?: number;
  @IsOptional() @IsEnum(MenstruacionCantidad) menstruacionCantidad?: MenstruacionCantidad | null;
  @IsOptional() @IsBoolean() dismenorrea?: boolean;
  @IsOptional() @IsEnum(DismenorreaIntensidad) dismenorreaIntensidad?: DismenorreaIntensidad | null;

  @IsOptional() @IsBoolean() menopausia?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() menopausiaEdad?: number | null;
  @IsOptional() @IsString() menopausiaSintomas?: string | null;
  @IsOptional() @IsBoolean() menopausiaTerapiaReemplazo?: boolean;

  @IsOptional() @Type(() => Number) @IsInt() @Min(10) inicioVidaSexualEdad?: number | null;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) parejasSexualesNumero?: number | null;
  @IsOptional() @IsString() metodoAnticonceptivoActual?: string | null;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) metodoAnticonceptivoTiempoUsoMeses?: number | null;
  @IsOptional() @IsArray() metodosAnticonceptivosPrevios?: object[] | null;

  @IsOptional() @IsDateString() citologiaUltimaFecha?: string | null;
  @IsOptional() @IsEnum(CitologiaResultado) citologiaResultado?: CitologiaResultado | null;
  @IsOptional() @IsString() citologiaNotas?: string | null;
  @IsOptional() @IsDateString() mamografiaUltimaFecha?: string | null;
  @IsOptional() @IsEnum(CitologiaResultado) mamografiaResultado?: CitologiaResultado | null;
  @IsOptional() @IsString() mamografiaNotas?: string | null;

  @IsOptional() @IsBoolean() infeccionesVaginales?: boolean;
  @IsOptional() @IsString() infeccionesVaginalesTipo?: string | null;
  @IsOptional() @IsString() infeccionesVaginalesFrecuencia?: string | null;

  @IsOptional() @IsBoolean() enfermedadPelvicaInflamatoria?: boolean;
  @IsOptional() @IsDateString() epiDate?: string | null;
  @IsOptional() @IsBoolean() endometriosis?: boolean;
  @IsOptional() @IsString() endometriosisTratamiento?: string | null;
  @IsOptional() @IsBoolean() miomatosisUterina?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) miomatosisUterinaCantidad?: number | null;
  @IsOptional() @IsString() miomatosisUterinaTratamiento?: string | null;
  @IsOptional() @IsBoolean() quistesOvaricos?: boolean;
  @IsOptional() @IsString() quistesOvaricosTipo?: string | null;
  @IsOptional() @IsString() quistesOvaricosTratamiento?: string | null;
  @IsOptional() @IsBoolean() sindromeOvarioPoliquistico?: boolean;

  @IsOptional() @IsArray() itsHistorial?: object[] | null;
  @IsOptional() @IsArray() cirugiasGinecologicas?: object[] | null;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) gestas?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) partos?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) cesareas?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) abortos?: number;
  @IsOptional() @IsArray() abortosTipo?: object[] | null;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) hijosVivos?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) hijosMuertos?: number;
  @IsOptional() @IsArray() embarazos?: object[] | null;

  @IsOptional() @IsBoolean() embarazoActual?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) embarazoActualSemanas?: number | null;
  @IsOptional() @IsDateString() embarazoActualFechaProbableParto?: string | null;
  @IsOptional() @IsBoolean() embarazoActualControlPrenatal?: boolean | null;
  @IsOptional() @IsString() embarazoActualComplicaciones?: string | null;

  @IsOptional() @IsBoolean() preeclampsia?: boolean;
  @IsOptional() @IsBoolean() eclampsia?: boolean;
  @IsOptional() @IsBoolean() diabetesGestacional?: boolean;
  @IsOptional() @IsBoolean() hemorragiaPostparto?: boolean;
  @IsOptional() @IsBoolean() rupturaPrematurMembranas?: boolean;
  @IsOptional() @IsBoolean() placentaPrevia?: boolean;
  @IsOptional() @IsBoolean() lactanciaActual?: boolean;
  @IsOptional() @IsString() otros?: string | null;
}
