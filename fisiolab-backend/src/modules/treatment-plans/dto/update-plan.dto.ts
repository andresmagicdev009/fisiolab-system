import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { CreatePlanDto } from './create-plan.dto';
import { EstadoPlan } from '../entities/treatment-plan.entity';

export class UpdatePlanDto extends PartialType(CreatePlanDto) {
  @ApiPropertyOptional({
    enum: [EstadoPlan.COMPLETADO, EstadoPlan.CANCELADO],
    description: 'Solo se puede completar o cancelar un plan activo',
  })
  @IsOptional() @IsIn([EstadoPlan.COMPLETADO, EstadoPlan.CANCELADO])
  estado?: EstadoPlan.COMPLETADO | EstadoPlan.CANCELADO;

  @ApiPropertyOptional({ example: 40, minimum: 0, maximum: 100 })
  @IsOptional() @IsNumber() @Min(0) @Max(100)
  progresoPorcentaje?: number;
}
