import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { WaitingListPriority, WaitingListStatus } from '../entities/waiting-list.entity';

export class UpdateWaitingListDto {
  @ApiPropertyOptional()
  @IsOptional() @IsDateString()
  fechaDeseada?: string;

  @ApiPropertyOptional({ example: 'c3d4e5f6-a7b8-9012-cdef-012345678901' })
  @IsOptional() @IsUUID()
  preferredProfessionalId?: string;

  @ApiPropertyOptional({ enum: WaitingListPriority })
  @IsOptional() @IsEnum(WaitingListPriority)
  prioridad?: WaitingListPriority;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional() @IsString() @MaxLength(500)
  motivoConsulta?: string;

  @ApiPropertyOptional({ enum: [WaitingListStatus.CANCELLED, WaitingListStatus.EXPIRED], description: 'Solo CANCELLED o EXPIRED permitidos por PATCH' })
  @IsOptional() @IsEnum([WaitingListStatus.CANCELLED, WaitingListStatus.EXPIRED])
  estado?: WaitingListStatus.CANCELLED | WaitingListStatus.EXPIRED;
}
