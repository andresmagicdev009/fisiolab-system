import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Length, Matches } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { Genero } from '../entities/patient.entity';

export class PatientQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Busca en nombres, apellidos y email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Búsqueda exacta por cédula (10 dígitos)' })
  @IsOptional()
  @Length(10, 10)
  @Matches(/^\d{10}$/)
  cedula?: string;

  @ApiPropertyOptional({ enum: Genero })
  @IsOptional()
  @IsEnum(Genero)
  genero?: Genero;
}
