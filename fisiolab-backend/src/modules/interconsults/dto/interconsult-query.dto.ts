import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { EstadoInterconsulta } from '../entities/interconsult.entity';

export class InterconsultQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: EstadoInterconsulta })
  @IsOptional() @IsEnum(EstadoInterconsulta)
  estado?: EstadoInterconsulta;

  @ApiPropertyOptional({ example: 'b2c3d4e5-f6a7-8901-bcde-f01234567890' })
  @IsOptional() @IsUUID()
  solicitanteId?: string;

  @ApiPropertyOptional({ example: 'c3d4e5f6-a7b8-9012-cdef-012345678901' })
  @IsOptional() @IsUUID()
  destinatarioId?: string;
}
