import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class CompleteAppointmentDto {
  @ApiProperty({ example: 35.00, description: 'Monto cobrado por la sesión, mayor a 0' })
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01)
  monto!: number;

  @ApiPropertyOptional({
    example: 'd4e5f6a7-b8c9-0123-def0-123456789012',
    description: 'Episodio a vincular. Requerido en SEGUIMIENTO e INTERCONSULTA.',
  })
  @IsOptional() @IsUUID()
  episodeId?: string;

  @ApiPropertyOptional({
    example: 'e5f6a7b8-c9d0-1234-ef01-234567890123',
    description: 'Plan de tratamiento activo. Si se provee, auto-crea una Session vinculada (CASO 3).',
  })
  @IsOptional() @IsUUID()
  planId?: string;
}
