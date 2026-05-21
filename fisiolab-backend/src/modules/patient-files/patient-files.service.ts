import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { Patient } from '../patients/entities/patient.entity';
import { UsersService } from '../users/users.service';
import { PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { FILE_STORAGE_PROVIDER, FileStorageProvider } from './interfaces/file-storage.provider';
import { PatientFile, CategoriaArchivo } from './entities/patient-file.entity';
import { UploadFileDto } from './dto/upload-file.dto';
import { FileQueryDto } from './dto/file-query.dto';

export interface MulterFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

const ALLOWED_MIMETYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/tiff',
  'application/dicom',
]);

const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

@Injectable()
export class PatientFilesService {
  constructor(
    @InjectRepository(PatientFile)
    private readonly fileRepo: Repository<PatientFile>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @Inject(FILE_STORAGE_PROVIDER)
    private readonly storage: FileStorageProvider,
    private readonly usersService: UsersService,
  ) {}

  async upload(
    patientId: string,
    file: MulterFile,
    dto: UploadFileDto,
    clerkUserId: string,
  ): Promise<PatientFile> {
    await this.assertPatientExists(patientId);

    if (!ALLOWED_MIMETYPES.has(file.mimetype)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido: ${file.mimetype}. Permitidos: PDF, JPEG, PNG, TIFF, DICOM`,
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      throw new BadRequestException('Archivo supera el límite de 20 MB');
    }

    const dbUser = await this.usersService.findByExternalId(clerkUserId);
    if (!dbUser) throw new NotFoundException('Profesional no encontrado');

    const ext = extname(file.originalname).toLowerCase() || this.mimetypeToExt(file.mimetype);
    const uuid = randomUUID();
    const categoria = dto.categoria ?? CategoriaArchivo.OTRO;
    const storageKey = `patients/${patientId}/${categoria}/${uuid}${ext}`;

    await this.storage.upload(storageKey, file.buffer, file.mimetype);

    const record = this.fileRepo.create({
      patientId,
      episodeId: dto.episodeId ?? null,
      uploadedBy: dbUser.id,
      filenameOriginal: file.originalname,
      filenameStored: `${uuid}${ext}`,
      storageKey,
      mimetype: file.mimetype,
      sizeBytes: file.size,
      categoria,
      descripcion: dto.descripcion ?? null,
    });

    return this.fileRepo.save(record);
  }

  async listFiles(
    patientId: string,
    query: FileQueryDto,
  ): Promise<PaginatedResponseDto<PatientFile>> {
    await this.assertPatientExists(patientId);

    const { page, limit, categoria, episodeId } = query;
    const qb = this.fileRepo
      .createQueryBuilder('f')
      .where('f.patient_id = :patientId', { patientId })
      .orderBy('f.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (categoria) qb.andWhere('f.categoria = :categoria', { categoria });
    if (episodeId) qb.andWhere('f.episode_id = :episodeId', { episodeId });

    const [data, total] = await qb.getManyAndCount();
    return PaginatedResponseDto.of(data, total, page, limit);
  }

  async getFile(patientId: string, fileId: string): Promise<PatientFile> {
    const file = await this.fileRepo.findOne({
      where: { id: fileId, patientId },
    });
    if (!file) throw new NotFoundException(`Archivo ${fileId} no encontrado`);
    return file;
  }

  async getPresignedUrl(
    patientId: string,
    fileId: string,
  ): Promise<{ url: string; expiresAt: string }> {
    const file = await this.getFile(patientId, fileId);
    const url = await this.storage.getPresignedUrl(file.storageKey, 900);
    const expiresAt = new Date(Date.now() + 900_000).toISOString();
    return { url, expiresAt };
  }

  async deleteFile(
    patientId: string,
    fileId: string,
    clerkUserId: string,
    userRole: string,
  ): Promise<void> {
    const file = await this.getFile(patientId, fileId);

    if (userRole !== 'admin') {
      const dbUser = await this.usersService.findByExternalId(clerkUserId);
      if (!dbUser || dbUser.id !== file.uploadedBy) {
        throw new NotFoundException(`Archivo ${fileId} no encontrado`);
      }
    }

    await this.storage.delete(file.storageKey);
    await this.fileRepo.remove(file);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async assertPatientExists(patientId: string): Promise<void> {
    const exists = await this.patientRepo.findOne({
      where: { id: patientId },
      select: ['id'],
    });
    if (!exists) throw new NotFoundException(`Paciente ${patientId} no encontrado`);
  }

  private mimetypeToExt(mimetype: string): string {
    const map: Record<string, string> = {
      'application/pdf': '.pdf',
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/tiff': '.tiff',
      'application/dicom': '.dcm',
    };
    return map[mimetype] ?? '';
  }
}
