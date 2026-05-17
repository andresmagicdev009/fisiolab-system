import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum AuditAction {
  READ_HC = 'READ_HC',
  UPDATE_HC = 'UPDATE_HC',
  DELETE_HC = 'DELETE_HC',
  AI_QUERY = 'AI_QUERY',
  PRESCRIPTION_CREATE = 'PRESCRIPTION_CREATE',
}

@Entity('audit_logs')
@Index(['userId'])
@Index(['createdAt'])
@Index(['resourceType'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 100 })
  action: string;

  @Column({ name: 'resource_type', length: 50, nullable: true, type: 'varchar' })
  resourceType: string | null;

  @Column({ name: 'resource_id', nullable: true, type: 'uuid' })
  resourceId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
