import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { TipoSesion, EstadoSesion } from '../entities/session.entity';

export class SessionQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50)
  limit: number = 20;

  @ApiPropertyOptional({ enum: EstadoSesion })
  @IsOptional() @IsEnum(EstadoSesion)
  estado?: EstadoSesion;

  @ApiPropertyOptional({ enum: TipoSesion })
  @IsOptional() @IsEnum(TipoSesion)
  tipo?: TipoSesion;

  @ApiPropertyOptional({ example: 'b2c3d4e5-f6a7-8901-bcde-f01234567890' })
  @IsOptional() @IsUUID()
  profesionalId?: string;

  @ApiPropertyOptional({ example: '2024-03-01', description: 'fechaSesion >= desde' })
  @IsOptional() @IsDateString()
  desde?: string;

  @ApiPropertyOptional({ example: '2024-03-31', description: 'fechaSesion <= hasta' })
  @IsOptional() @IsDateString()
  hasta?: string;
}
