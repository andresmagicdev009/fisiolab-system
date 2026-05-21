import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class EvaluationQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'b2c3d4e5-f6a7-8901-bcde-f01234567890' })
  @IsOptional() @IsUUID()
  profesionalId?: string;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional() @IsDateString()
  desde?: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsOptional() @IsDateString()
  hasta?: string;
}
