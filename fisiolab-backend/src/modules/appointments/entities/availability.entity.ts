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
import { User } from '../../users/entities/user.entity';

export enum DayOfWeek {
  MONDAY    = 'monday',
  TUESDAY   = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY  = 'thursday',
  FRIDAY    = 'friday',
  SATURDAY  = 'saturday',
  SUNDAY    = 'sunday',
}

@Entity('availabilities')
@Index(['professionalId', 'dayOfWeek', 'isActive'])
export class Availability {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'professional_id', type: 'uuid' })
  professionalId!: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'professional_id' })
  professional!: User;

  @Column({ name: 'day_of_week', type: 'enum', enum: DayOfWeek })
  dayOfWeek!: DayOfWeek;

  @Column({ name: 'start_time', type: 'time' })
  startTime!: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime!: string;

  @Column({ name: 'slot_duration_minutes', type: 'int', default: 30 })
  slotDurationMinutes!: number;

  @Column({ name: 'break_duration_minutes', type: 'int', default: 0 })
  breakDurationMinutes!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ name: 'effective_from', type: 'date', nullable: true })
  effectiveFrom!: string | null;

  @Column({ name: 'effective_until', type: 'date', nullable: true })
  effectiveUntil!: string | null;

  @Column({ name: 'zona_horaria', type: 'varchar', length: 64, default: 'America/Guayaquil' })
  zonaHoraria!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
