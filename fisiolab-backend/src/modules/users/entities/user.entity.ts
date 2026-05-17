import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  /** Null until user registers in Clerk (pre-created professionals) */
  @Column({ type: 'varchar', unique: true, nullable: true, name: 'external_auth_id' })
  externalAuthId!: string | null;

  @Column({ default: 'paciente' })
  role!: string;

  @Column({ nullable: true, type: 'varchar', length: 10 })
  cedula!: string | null;

  @Column({ nullable: true, type: 'varchar', length: 100 })
  nombres!: string | null;

  @Column({ nullable: true, type: 'varchar', length: 100 })
  apellidos!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
