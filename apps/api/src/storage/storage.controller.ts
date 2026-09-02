import { Controller, Get, NotFoundException, Query, StreamableFile } from '@nestjs/common';
import { createReadStream, existsSync } from 'node:fs';
import { join, normalize } from 'node:path';
import { LOCAL_STORAGE_ROOT } from './providers/local-storage.provider';

/**
 * Dev-only static file server for LocalStorageProvider uploads. Not used
 * when STORAGE_PROVIDER=r2 (real uploads are served straight from R2/CDN).
 * `key` is a query param rather than a path segment to avoid any
 * path-to-regexp wildcard-route version fragility.
 */
@Controller('media')
export class StorageController {
  @Get()
  serve(@Query('key') key: string): StreamableFile {
    if (!key) {
      throw new NotFoundException();
    }
    const relativePath = normalize(key);
    if (relativePath.startsWith('..')) {
      throw new NotFoundException();
    }
    const filePath = join(LOCAL_STORAGE_ROOT, relativePath);
    if (!existsSync(filePath)) {
      throw new NotFoundException();
    }
    return new StreamableFile(createReadStream(filePath));
  }
}
