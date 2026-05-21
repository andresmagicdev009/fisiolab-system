import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';
import { EstadoPago, MetodoPago } from '../entities/session-payment.entity';

export class UpdateSessionPaymentDto {
  @ApiPropertyOptional({
    enum: EstadoPago,
    description: 'Estado destino: PAGADO (pago completo) o PARCIAL (abono)',
    example: EstadoPago.PAGADO,
  })
  @IsOptional()
  @IsEnum(EstadoPago)
  estadoPago?: EstadoPago;

  @ApiPropertyOptional({ enum: MetodoPago, example: MetodoPago.EFECTIVO })
  @IsOptional()
  @IsEnum(MetodoPago)
  metodoPago?: MetodoPago;

  @ApiPropertyOptional({
    description: 'Monto pagado. Si es PARCIAL, puede ser menor al total.',
    example: 20.00,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  monto?: number;

  @ApiPropertyOptional({
    description: 'Fecha del pago. ISO 8601. Default: ahora.',
    example: '2024-03-20T14:30:00Z',
  })
  @IsOptional()
  @IsDateString()
  fechaPago?: string;
}
