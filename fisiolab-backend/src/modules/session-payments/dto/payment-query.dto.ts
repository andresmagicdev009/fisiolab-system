import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { EstadoPago } from '../entities/session-payment.entity';

export class PaymentQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: EstadoPago, description: 'Filtrar por estado de pago' })
  @IsOptional()
  @IsEnum(EstadoPago)
  estadoPago?: EstadoPago;

  @ApiPropertyOptional({ example: '2024-01-01', description: 'Fecha mínima de creación (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  desde?: string;

  @ApiPropertyOptional({ example: '2024-12-31', description: 'Fecha máxima de creación (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  hasta?: string;
}
