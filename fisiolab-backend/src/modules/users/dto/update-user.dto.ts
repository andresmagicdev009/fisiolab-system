import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 3,
    minimum: 1,
    maximum: 10,
    description: 'Cuántos pacientes atiende el profesional en paralelo en un mismo slot',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  capacidadAtencionParalela?: number;
}
