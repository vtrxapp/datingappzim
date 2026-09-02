import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { StorageProvider, UploadResult } from '../storage-provider.interface';

/**
 * Cloudflare R2 is S3-compatible, so the AWS SDK v3 S3 client works against
 * it by pointing `endpoint` at the account's R2 endpoint. Assumes the bucket
 * (or a custom domain in front of it) is configured for public read access —
 * R2_PUBLIC_BASE_URL is that public origin.
 */
@Injectable()
export class R2StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.get<string>('storage.r2.accountId')!;
    this.bucket = this.configService.get<string>('storage.r2.bucket')!;
    this.publicBaseUrl = this.configService.get<string>('storage.r2.publicBaseUrl')!;

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.configService.get<string>('storage.r2.accessKeyId')!,
        secretAccessKey: this.configService.get<string>('storage.r2.secretAccessKey')!,
      },
    });
  }

  async upload(key: string, buffer: Buffer, contentType: string): Promise<UploadResult> {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: buffer, ContentType: contentType }),
    );
    return { key, url: `${this.publicBaseUrl.replace(/\/$/, '')}/${key}` };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}
