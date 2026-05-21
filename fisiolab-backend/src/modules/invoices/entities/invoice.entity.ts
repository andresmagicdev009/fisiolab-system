import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SessionPayment } from '../../session-payments/entities/session-payment.entity';

@Entity('invoices')
@Index(['paymentId'])
@Index(['numeroFactura'], { unique: true, where: '"numero_factura" IS NOT NULL' })
export class Invoice {
  @ApiProperty({ example: 'f1a2b3c4-d5e6-7890-abcd-ef1234567890' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', nullable: true })
  @Column({ name: 'payment_id', type: 'uuid', nullable: true })
  paymentId!: string | null;

  @ManyToOne(() => SessionPayment, { eager: false, nullable: true })
  @JoinColumn({ name: 'payment_id' })
  payment?: SessionPayment;

  @ApiPropertyOptional({
    example: '001-001-000000001',
    description: 'Número de factura SRI — formato NNN-NNN-NNNNNNNNN',
    nullable: true,
  })
  @Column({ name: 'numero_factura', type: 'varchar', length: 50, nullable: true, unique: true })
  numeroFactura!: string | null;

  @ApiPropertyOptional({
    example: '1790123456001',
    description: 'RUC del emisor (13 dígitos Ecuador)',
    nullable: true,
  })
  @Column({ name: 'ruc_emisor', type: 'varchar', length: 13, nullable: true })
  rucEmisor!: string | null;

  @ApiPropertyOptional({
    example: '2403202401179012345600110010010000000011234567813',
    description: 'Clave de acceso SRI (49 dígitos)',
    nullable: true,
  })
  @Column({ name: 'clave_acceso', type: 'varchar', length: 49, nullable: true })
  claveAcceso!: string | null;

  @ApiPropertyOptional({
    example: '2403202420241234567',
    description: 'Número de autorización SRI',
    nullable: true,
  })
  @Column({ name: 'autorizacion_sri', type: 'varchar', length: 50, nullable: true })
  autorizacionSri!: string | null;

  @ApiPropertyOptional({ description: 'XML RIDE de la factura electrónica SRI', nullable: true })
  @Column({ name: 'xml_factura', type: 'text', nullable: true })
  xmlFactura!: string | null;

  @ApiProperty({ example: '2024-03-20T14:30:00Z' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
