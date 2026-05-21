import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class PrescriptionQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'b2c3d4e5-f6a7-8901-bcde-f01234567890' })
  @IsOptional() @IsUUID()
  medicoId?: string;

  @ApiPropertyOptional({ example: '2024-01-01', description: 'Desde fecha (YYYY-MM-DD)' })
  @IsOptional() @IsDateString()
  desde?: string;

  @ApiPropertyOptional({ example: '2024-12-31', description: 'Hasta fecha (YYYY-MM-DD)' })
  @IsOptional() @IsDateString()
  hasta?: string;
}
