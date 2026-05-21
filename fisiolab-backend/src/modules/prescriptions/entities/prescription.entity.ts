import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Medication } from './medication.entity';

@Entity('prescriptions')
@Index(['episodeId'])
@Index(['medicoId'])
@Index(['pacienteId'])
export class Prescription {
  @ApiProperty({ example: 'f1a2b3c4-d5e6-7890-abcd-ef1234567890' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: 'd4e5f6a7-b8c9-0123-def0-123456789012' })
  @Column({ name: 'episode_id', type: 'uuid' })
  episodeId!: string;

  @ApiProperty({ example: 'HC-2024-0037' })
  @Column({ name: 'codigo_hc', type: 'varchar', length: 15 })
  codigoHc!: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @Column({ name: 'patient_id', type: 'uuid' })
  pacienteId!: string;

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f01234567890', description: 'UUID del médico (rol MEDICO)' })
  @Column({ name: 'medico_id', type: 'uuid' })
  medicoId!: string;

  @ApiProperty({ example: 1, description: 'Número secuencial por episodio' })
  @Column({ name: 'numero_prescripcion', type: 'int' })
  numeroPrescripcion!: number;

  @ApiProperty({ example: '2024-03-20' })
  @Column({ name: 'fecha_prescripcion', type: 'date' })
  fechaPrescripcion!: Date;

  @ApiPropertyOptional({ example: 'base64-encoded-signature', nullable: true })
  @Column({ name: 'firma_digital', type: 'text', nullable: true })
  firmaDigital!: string | null;

  @ApiPropertyOptional({ nullable: true })
  @Column({ type: 'text', nullable: true })
  observaciones!: string | null;

  @ApiProperty({ type: () => [Medication] })
  @OneToMany(() => Medication, (med) => med.prescriptionId, { cascade: ['insert', 'update'] })
  medications!: Medication[];

  @ApiProperty({ example: '2024-03-20T10:30:00Z' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-03-20T10:30:00Z' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
