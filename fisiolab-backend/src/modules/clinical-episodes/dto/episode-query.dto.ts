import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { EstadoEpisodio } from '../entities/clinical-episode.entity';

export class EpisodeQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: EstadoEpisodio })
  @IsOptional()
  @IsEnum(EstadoEpisodio)
  estado?: EstadoEpisodio;

  @ApiPropertyOptional({ example: 'b2c3d4e5-f6a7-8901-bcde-f01234567890' })
  @IsOptional()
  @IsUUID()
  profesionalId?: string;

  @ApiPropertyOptional({ example: 'lumbalgia' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  desde?: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  hasta?: string;
}
