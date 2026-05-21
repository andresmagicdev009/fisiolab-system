import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { CategoriaArchivo } from '../entities/patient-file.entity';

export class UploadFileDto {
  @ApiPropertyOptional({ enum: CategoriaArchivo, default: CategoriaArchivo.OTRO })
  @IsOptional()
  @IsEnum(CategoriaArchivo)
  categoria?: CategoriaArchivo;

  @ApiPropertyOptional({ example: 'Hemograma completo — Marzo 2024' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @ApiPropertyOptional({ example: 'c3d4e5f6-a7b8-9012-cdef-012345678901', description: 'Asociar a episodio clínico' })
  @IsOptional()
  @IsUUID()
  episodeId?: string;
}
