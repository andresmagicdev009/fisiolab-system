import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CancelAppointmentDto {
  @ApiProperty({ example: 'Paciente no se presentó sin aviso previo.', minLength: 5, maxLength: 500 })
  @IsString() @MinLength(5) @MaxLength(500)
  motivoCancelacion!: string;
}
