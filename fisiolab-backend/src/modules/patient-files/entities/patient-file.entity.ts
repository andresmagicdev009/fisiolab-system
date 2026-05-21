import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum CategoriaArchivo {
  LABORATORIO = 'laboratorio',
  IMAGEN = 'imagen',
  REFERENCIA = 'referencia',
  CONSENTIMIENTO = 'consentimiento',
  RECETA = 'receta',
  OTRO = 'otro',
}

@Entity('patient_files')
@Index(['patientId'])
@Index(['episodeId'])
export class PatientFile {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f01234567890' })
  @Column({ name: 'patient_id', type: 'uuid' })
  patientId!: string;

  @ApiPropertyOptional({ example: 'c3d4e5f6-a7b8-9012-cdef-012345678901', nullable: true })
  @Column({ name: 'episode_id', type: 'uuid', nullable: true })
  episodeId!: string | null;

  @ApiProperty({ example: 'd4e5f6a7-b8c9-0123-def0-123456789012' })
  @Column({ name: 'uploaded_by', type: 'uuid' })
  uploadedBy!: string;

  @ApiProperty({ example: 'resultado_laboratorio_2024.pdf' })
  @Column({ name: 'filename_original', type: 'varchar', length: 500 })
  filenameOriginal!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000.pdf' })
  @Column({ name: 'filename_stored', type: 'varchar', length: 500 })
  filenameStored!: string;

  @ApiProperty({ example: 'patients/b2c3.../laboratorio/550e8400....pdf' })
  @Column({ name: 'storage_key', type: 'varchar', length: 1000 })
  storageKey!: string;

  @ApiProperty({ example: 'application/pdf' })
  @Column({ type: 'varchar', length: 100 })
  mimetype!: string;

  @ApiProperty({ example: 204800, description: 'Tamaño en bytes' })
  @Column({ name: 'size_bytes', type: 'integer' })
  sizeBytes!: number;

  @ApiProperty({ enum: CategoriaArchivo, example: CategoriaArchivo.LABORATORIO })
  @Column({ type: 'enum', enum: CategoriaArchivo, default: CategoriaArchivo.OTRO })
  categoria!: CategoriaArchivo;

  @ApiPropertyOptional({ example: 'Resultados de hemograma completo - Marzo 2024', nullable: true })
  @Column({ type: 'text', nullable: true })
  descripcion!: string | null;

  @ApiProperty({ example: '2024-03-20T10:30:00Z' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-03-20T10:30:00Z' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
