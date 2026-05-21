export const FILE_STORAGE_PROVIDER = 'FILE_STORAGE_PROVIDER';

export abstract class FileStorageProvider {
  abstract upload(key: string, buffer: Buffer, mimetype: string): Promise<void>;
  abstract getPresignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
  abstract delete(key: string): Promise<void>;
}
