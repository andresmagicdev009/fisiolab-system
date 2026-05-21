import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'fechaFinAfterInicio', async: false })
class FechaFinAfterInicioConstraint implements ValidatorConstraintInterface {
  validate(fechaFin: string | undefined, args: ValidationArguments) {
    const obj = args.object as CreatePlanDto;
    if (!fechaFin || !obj.fechaInicio) return true;
    return new Date(fechaFin) >= new Date(obj.fechaInicio);
  }
  defaultMessage() {
    return 'fechaFin debe ser igual o posterior a fechaInicio';
  }
}

export class CreatePlanDto {
  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f01234567890' })
  @IsUUID()
  profesionalId!: string;

  @ApiProperty({ example: 'Recuperar ROM completo de hombro y fuerza muscular grado 5.' })
  @IsString() @MinLength(10) @MaxLength(1000)
  objetivoTerapeutico!: string;

  @ApiPropertyOptional({ example: 4, minimum: 1, maximum: 52 })
  @IsOptional() @IsInt() @Min(1) @Max(52)
  duracionEstimadaSemanas?: number;

  @ApiPropertyOptional({ example: 3, minimum: 1, maximum: 7 })
  @IsOptional() @IsInt() @Min(1) @Max(7)
  frecuenciaSemanal?: number;

  @ApiPropertyOptional({ example: '2024-03-20' })
  @IsOptional() @IsDateString()
  fechaInicio?: string;

  @ApiPropertyOptional({ example: '2024-04-17' })
  @IsOptional() @IsDateString()
  @Validate(FechaFinAfterInicioConstraint)
  fechaFin?: string;

  @ApiPropertyOptional({ example: 'uuid-cita', description: 'Cita asociada al inicio del plan' })
  @IsOptional() @IsUUID()
  appointmentId?: string;

  @ApiPropertyOptional({ example: 'Iniciar con ejercicios en cadena cinética cerrada.' })
  @IsOptional() @IsString() @MaxLength(1000)
  observaciones?: string;
}
