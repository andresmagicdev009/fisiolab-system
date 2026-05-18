import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationQueryDto {
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
}

export class PaginationMeta {
  total!: number;
  page!: number;
  limit!: number;
  pages!: number;
}

export class PaginatedResponseDto<T> {
  data!: T[];
  meta!: PaginationMeta;

  static of<T>(data: T[], total: number, page: number, limit: number): PaginatedResponseDto<T> {
    const dto = new PaginatedResponseDto<T>();
    dto.data = data;
    dto.meta = { total, page, limit, pages: Math.ceil(total / limit) };
    return dto;
  }
}
