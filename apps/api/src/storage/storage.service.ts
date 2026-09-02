import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { STORAGE_PROVIDER, StorageProvider, UploadResult } from './storage-provider.interface';
import { ImageCompressionService } from './image-compression.service';

@Injectable()
export class StorageService {
  constructor(
    @Inject(STORAGE_PROVIDER) private readonly provider: StorageProvider,
    private readonly imageCompressionService: ImageCompressionService,
  ) {}

  async uploadCompressedImage(folder: string, originalBuffer: Buffer): Promise<UploadResult> {
    const compressed = await this.imageCompressionService.compress(originalBuffer);
    const key = `${folder}/${randomUUID()}.jpg`;
    return this.provider.upload(key, compressed, 'image/jpeg');
  }

  /** For sensitive documents (ID uploads) we still compress for storage efficiency, but the
   * key is kept out of any publicly-guessable/listable path and the URL is only ever handed
   * to admins reviewing verification requests. */
  uploadRaw(folder: string, buffer: Buffer, contentType: string) {
    const key = `${folder}/${randomUUID()}`;
    return this.provider.upload(key, buffer, contentType);
  }

  delete(key: string): Promise<void> {
    return this.provider.delete(key);
  }
}
