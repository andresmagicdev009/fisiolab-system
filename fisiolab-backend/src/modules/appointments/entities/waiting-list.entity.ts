import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { User } from '../../users/entities/user.entity';
import { Appointment, TipoCita } from './appointment.entity';

export enum WaitingListPriority {
  URGENT = 'urgent',
  HIGH   = 'high',
  NORMAL = 'normal',
  LOW    = 'low',
}

export enum WaitingListStatus {
  PENDING   = 'pending',
  ASSIGNED  = 'assigned',
  CANCELLED = 'cancelled',
  EXPIRED   = 'expired',
}

@Entity('waiting_lists')
@Index(['estado', 'prioridad', 'createdAt'])
@Index(['patientId'])
export class WaitingList {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId!: string;

  @ManyToOne(() => Patient, { eager: false })
  @JoinColumn({ name: 'patient_id' })
  patient!: Patient;

  @Column({ name: 'preferred_professional_id', type: 'uuid', nullable: true })
  preferredProfessionalId!: string | null;

  @ManyToOne(() => User, { eager: false, nullable: true })
  @JoinColumn({ name: 'preferred_professional_id' })
  preferredProfessional!: User | null;

  @Column({ name: 'tipo_cita_solicitado', type: 'varchar', length: 50 })
  tipoCitaSolicitado!: TipoCita;

  @Column({ name: 'fecha_deseada', type: 'date' })
  fechaDeseada!: string;

  @Column({
    name: 'prioridad',
    type: 'enum',
    enum: WaitingListPriority,
    default: WaitingListPriority.NORMAL,
  })
  prioridad!: WaitingListPriority;

  @Column({ name: 'motivo_consulta', type: 'text', nullable: true })
  motivoConsulta!: string | null;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: WaitingListStatus,
    default: WaitingListStatus.PENDING,
  })
  estado!: WaitingListStatus;

  @Column({ name: 'atendido_en', type: 'timestamp', nullable: true })
  atendidoEn!: Date | null;

  @Column({ name: 'appointment_id', type: 'uuid', nullable: true })
  appointmentId!: string | null;

  @ManyToOne(() => Appointment, { eager: false, nullable: true })
  @JoinColumn({ name: 'appointment_id' })
  appointment!: Appointment | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
