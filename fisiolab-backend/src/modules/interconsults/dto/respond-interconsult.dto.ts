import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class RespondInterconsultDto {
  @ApiProperty({ example: 'IRM confirma hernia discal L4-L5. Recomiendo manejo conservador 6 semanas más con TENS y tracción.' })
  @IsString() @MinLength(10) @MaxLength(3000)
  respuesta!: string;
}
