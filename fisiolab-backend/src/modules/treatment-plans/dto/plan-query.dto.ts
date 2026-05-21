import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { EstadoPlan } from '../entities/treatment-plan.entity';

export class PlanQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: EstadoPlan })
  @IsOptional() @IsEnum(EstadoPlan)
  estado?: EstadoPlan;

  @ApiPropertyOptional({ example: 'b2c3d4e5-f6a7-8901-bcde-f01234567890' })
  @IsOptional() @IsUUID()
  profesionalId?: string;
}
