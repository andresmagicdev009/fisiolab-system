import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class RescheduleAppointmentDto {
  @ApiProperty({
    example: '2024-04-05T10:00:00Z',
    description: 'Nueva fecha/hora de la cita. ISO 8601. No puede ser en el pasado.',
  })
  @IsDateString()
  scheduledAt!: string;

  @ApiPropertyOptional({
    example: 'Paciente solicita cambio por motivos laborales',
    description: 'Motivo de la reprogramación. Se guarda en motivoReprogramacion.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivo?: string;
}
