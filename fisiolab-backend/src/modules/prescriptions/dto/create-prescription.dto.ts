import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateMedicationDto } from './create-medication.dto';

export class CreatePrescriptionDto {
  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f01234567890', description: 'UUID del médico prescriptor (rol MEDICO)' })
  @IsUUID()
  medicoId!: string;

  @ApiProperty({ example: '2024-03-20', description: 'Fecha de prescripción (YYYY-MM-DD)' })
  @IsDateString()
  fechaPrescripcion!: string;

  @ApiPropertyOptional({ example: 'Paciente con dolor agudo post-lesión deportiva.' })
  @IsOptional() @IsString() @MaxLength(1000)
  observaciones?: string;

  @ApiPropertyOptional({ example: 'base64-or-hash-firma' })
  @IsOptional() @IsString() @MaxLength(2000)
  firmaDigital?: string;

  @ApiPropertyOptional({
    description: 'Medicamentos a incluir en la receta (mínimo 1 si se provee)',
    type: () => [CreateMedicationDto],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateMedicationDto)
  medications?: CreateMedicationDto[];
}
