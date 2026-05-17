import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  Validate,
} from 'class-validator';
import { Genero, EstadoCivil } from '../entities/patient.entity';
import { CedulaEcuatorianaConstraint } from '../../../common/validators/cedula-ecuatoriana.validator';

export class CreatePatientDto {
  @ApiProperty({ example: '1713175071', description: 'Cédula ecuatoriana (10 dígitos)' })
  @IsNotEmpty({ message: 'La cédula es obligatoria' })
  @Length(10, 10, { message: 'La cédula debe tener exactamente 10 dígitos' })
  @Matches(/^\d{10}$/, { message: 'La cédula debe contener solo números' })
  @Validate(CedulaEcuatorianaConstraint)
  cedula!: string;

  @ApiProperty({ example: 'Juan Carlos', description: 'Nombres del paciente' })
  @IsNotEmpty({ message: 'Los nombres son obligatorios' })
  @IsString()
  @Length(2, 100)
  nombres!: string;

  @ApiProperty({ example: 'Rodríguez Pérez', description: 'Apellidos del paciente' })
  @IsNotEmpty({ message: 'Los apellidos son obligatorios' })
  @IsString()
  @Length(2, 100)
  apellidos!: string;

  @ApiProperty({ example: '1990-05-20', description: 'Fecha de nacimiento (YYYY-MM-DD)' })
  @IsNotEmpty({ message: 'La fecha de nacimiento es obligatoria' })
  @IsDateString({}, { message: 'Fecha inválida (YYYY-MM-DD)' })
  fechaNacimiento!: string;

  @ApiProperty({ enum: Genero, example: Genero.MASCULINO })
  @IsNotEmpty({ message: 'El género es obligatorio' })
  @IsEnum(Genero, { message: 'Género debe ser: masculino, femenino u otro' })
  genero!: Genero;

  @ApiPropertyOptional({ example: 'juan@email.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  email?: string;

  @ApiPropertyOptional({ example: '0991234567' })
  @IsOptional()
  @Matches(/^\d{10}$/, { message: 'Teléfono debe tener 10 dígitos' })
  telefono?: string;

  @ApiPropertyOptional({ example: '0987654321' })
  @IsOptional()
  @Matches(/^\d{10}$/, { message: 'Teléfono de emergencia debe tener 10 dígitos' })
  telefonoEmergencia?: string;

  @ApiPropertyOptional({ example: 'Av. 6 de Diciembre N24-567' })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  direccion?: string;

  @ApiPropertyOptional({ example: 'Quito' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  ciudad?: string;

  @ApiPropertyOptional({ example: 'Pichincha' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  provincia?: string;

  @ApiPropertyOptional({ example: '170150' })
  @IsOptional()
  @Matches(/^\d{6}$/, { message: 'Código postal debe tener 6 dígitos' })
  codigoPostal?: string;

  @ApiPropertyOptional({ example: 'Ingeniero' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  ocupacion?: string;

  @ApiPropertyOptional({ enum: EstadoCivil, example: EstadoCivil.SOLTERO })
  @IsOptional()
  @IsEnum(EstadoCivil, { message: 'Estado civil inválido' })
  estadoCivil?: EstadoCivil;
}
