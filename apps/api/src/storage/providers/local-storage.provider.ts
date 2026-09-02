import { Injectable } from '@nestjs/common';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { StorageProvider, UploadResult } from '../storage-provider.interface';

const LOCAL_STORAGE_ROOT = join(process.cwd(), '.local-storage');

/**
 * Dev-only stand-in for Cloudflare R2: writes to disk and serves files back
 * via StorageController's /api/media/* route. Never use in production.
 */
@Injectable()
export class LocalStorageProvider implements StorageProvider {
  async upload(key: string, buffer: Buffer, _contentType: string): Promise<UploadResult> {
    const filePath = join(LOCAL_STORAGE_ROOT, key);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, buffer);
    const apiPort = process.env.API_PORT ?? '4000';
    return { key, url: `http://localhost:${apiPort}/api/media?key=${encodeURIComponent(key)}` };
  }

  async delete(key: string): Promise<void> {
    const filePath = join(LOCAL_STORAGE_ROOT, key);
    await rm(filePath, { force: true });
  }
}

export { LOCAL_STORAGE_ROOT };
