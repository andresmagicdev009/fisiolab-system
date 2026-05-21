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
import { Appointment } from '../../appointments/entities/appointment.entity';

export enum EstadoPago {
  PENDIENTE = 'PENDIENTE',
  PAGADO = 'PAGADO',
  PARCIAL = 'PARCIAL',
}

export enum MetodoPago {
  EFECTIVO = 'EFECTIVO',
  TRANSFERENCIA = 'TRANSFERENCIA',
  TARJETA = 'TARJETA',
  SEGURO = 'SEGURO',
}

@Entity('session_payments')
@Index(['appointmentId'])
@Index(['estadoPago'])
export class SessionPayment {
  @ApiProperty({ example: 'f1a2b3c4-d5e6-7890-abcd-ef1234567890' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', nullable: true })
  @Column({ name: 'appointment_id', type: 'uuid', nullable: true })
  appointmentId!: string | null;

  @ManyToOne(() => Appointment, { eager: false, nullable: true })
  @JoinColumn({ name: 'appointment_id' })
  appointment?: Appointment;

  @ApiProperty({ example: 45.00 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto!: number;

  @ApiProperty({ enum: EstadoPago, example: EstadoPago.PENDIENTE })
  @Column({ name: 'estado_pago', type: 'varchar', default: EstadoPago.PENDIENTE })
  estadoPago!: EstadoPago;

  @ApiPropertyOptional({ enum: MetodoPago, example: MetodoPago.EFECTIVO, nullable: true })
  @Column({ name: 'metodo_pago', type: 'varchar', nullable: true })
  metodoPago!: MetodoPago | null;

  @ApiPropertyOptional({ example: '2024-03-20T14:30:00Z', nullable: true })
  @Column({ name: 'fecha_pago', type: 'timestamp', nullable: true })
  fechaPago!: Date | null;

  @ApiProperty({ example: '2024-03-20T10:00:00Z' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
