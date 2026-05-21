import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { EstadoTarjetero } from '../entities/tarjetero-indice.entity';

export class TarjeteroQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'rodriguez' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'HC-2024-0037' })
  @IsOptional()
  @IsString()
  codigoHc?: string;

  @ApiPropertyOptional({ enum: EstadoTarjetero })
  @IsOptional()
  @IsEnum(EstadoTarjetero)
  estado?: EstadoTarjetero;

  @ApiPropertyOptional({ example: 2024 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  anio?: number;
}
