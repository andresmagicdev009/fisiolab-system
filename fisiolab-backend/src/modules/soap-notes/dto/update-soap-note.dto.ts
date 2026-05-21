import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from 'class-validator';
import { SoapADto, SoapODto, SoapPDto, SoapSDto } from './create-soap-note.dto';

export class UpdateSoapNoteDto {
  @ApiPropertyOptional({ example: '2024-03-20' })
  @IsOptional() @IsDateString()
  fechaSesion?: string;

  @ApiPropertyOptional({ example: 'b2c3d4e5-f6a7-8901-bcde-f01234567890' })
  @IsOptional() @IsUUID()
  profesionalId?: string;

  @ApiPropertyOptional({ type: () => SoapSDto })
  @IsOptional() @ValidateNested() @Type(() => SoapSDto)
  subjetivo?: SoapSDto;

  @ApiPropertyOptional({ type: () => SoapODto })
  @IsOptional() @ValidateNested() @Type(() => SoapODto)
  objetivo?: SoapODto;

  @ApiPropertyOptional({ type: () => SoapADto })
  @IsOptional() @ValidateNested() @Type(() => SoapADto)
  analisis?: SoapADto;

  @ApiPropertyOptional({ type: () => SoapPDto })
  @IsOptional() @ValidateNested() @Type(() => SoapPDto)
  plan?: SoapPDto;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(1000)
  observaciones?: string;
}
