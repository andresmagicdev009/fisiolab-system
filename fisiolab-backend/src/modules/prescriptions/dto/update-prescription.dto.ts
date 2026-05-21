import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdatePrescriptionDto {
  @ApiPropertyOptional()
  @IsOptional() @IsUUID()
  medicoId?: string;

  @ApiPropertyOptional({ example: '2024-03-20' })
  @IsOptional() @IsDateString()
  fechaPrescripcion?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(1000)
  observaciones?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(2000)
  firmaDigital?: string;
}
