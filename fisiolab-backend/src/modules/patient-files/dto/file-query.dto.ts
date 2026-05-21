import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { CategoriaArchivo } from '../entities/patient-file.entity';

export class FileQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional({ enum: CategoriaArchivo })
  @IsOptional()
  @IsEnum(CategoriaArchivo)
  categoria?: CategoriaArchivo;

  @ApiPropertyOptional({ description: 'Filtrar por episodio clínico' })
  @IsOptional()
  @IsUUID()
  episodeId?: string;
}
