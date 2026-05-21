import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class CreateInvoiceDto {
  @ApiPropertyOptional({
    example: '001-001-000000001',
    description: 'Número de factura SRI — formato NNN-NNN-NNNNNNNNN',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{3}-\d{3}-\d{9}$/, { message: 'numeroFactura debe tener formato 001-001-000000001' })
  numeroFactura?: string;

  @ApiPropertyOptional({
    example: '1790123456001',
    description: 'RUC del emisor (13 dígitos)',
  })
  @IsOptional()
  @IsString()
  @Length(13, 13, { message: 'rucEmisor debe tener 13 dígitos' })
  @Matches(/^\d{13}$/, { message: 'rucEmisor debe contener solo dígitos' })
  rucEmisor?: string;

  @ApiPropertyOptional({
    example: '2403202401179012345600110010010000000011234567813',
    description: 'Clave de acceso SRI (49 dígitos)',
  })
  @IsOptional()
  @IsString()
  @Length(49, 49, { message: 'claveAcceso debe tener 49 dígitos' })
  @Matches(/^\d{49}$/, { message: 'claveAcceso debe contener solo dígitos' })
  claveAcceso?: string;

  @ApiPropertyOptional({ description: 'Número de autorización SRI', example: '2403202420241234567' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  autorizacionSri?: string;

  @ApiPropertyOptional({ description: 'XML RIDE de la factura electrónica SRI' })
  @IsOptional()
  @IsString()
  xmlFactura?: string;
}
