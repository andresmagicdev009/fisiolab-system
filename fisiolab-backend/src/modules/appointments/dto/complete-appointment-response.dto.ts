import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Appointment } from '../entities/appointment.entity';

export class CompleteAppointmentResponseDto {
  @ApiProperty({ type: () => Appointment })
  appointment!: Appointment;

  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'UUID de la sesión auto-creada (solo CASO 3: episodeId + planId). Null en otros casos.',
    nullable: true,
  })
  sessionId!: string | null;
}
