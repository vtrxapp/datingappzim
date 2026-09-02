export const STORAGE_PROVIDER = 'STORAGE_PROVIDER';

export interface UploadResult {
  key: string;
  url: string;
}

/**
 * Media storage abstraction. The real implementation targets Cloudflare R2
 * (S3-compatible); local dev uses a filesystem-backed mock so photo uploads
 * work without any cloud credentials.
 */
export interface StorageProvider {
  upload(key: string, buffer: Buffer, contentType: string): Promise<UploadResult>;
  delete(key: string): Promise<void>;
}
