import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { StorageProvider, UploadResult } from '../storage-provider.interface';

/**
 * Stores media in a Supabase Storage bucket. Uploads go through the service
 * role key, which bypasses RLS, so no storage.objects INSERT policy is
 * needed — only the public SELECT policy on the bucket (see the
 * create_tariro_media_bucket migration) for reads.
 */
@Injectable()
export class SupabaseStorageProvider implements StorageProvider {
  private readonly client: SupabaseClient;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('storage.supabase.url')!;
    const serviceRoleKey = this.configService.get<string>('storage.supabase.serviceRoleKey')!;
    this.bucket = this.configService.get<string>('storage.supabase.bucket')!;
    this.client = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
  }

  async upload(key: string, buffer: Buffer, contentType: string): Promise<UploadResult> {
    const { error } = await this.client.storage.from(this.bucket).upload(key, buffer, {
      contentType,
      upsert: false,
    });
    if (error) {
      throw new Error(`Supabase storage upload failed: ${error.message}`);
    }
    const { data } = this.client.storage.from(this.bucket).getPublicUrl(key);
    return { key, url: data.publicUrl };
  }

  async delete(key: string): Promise<void> {
    const { error } = await this.client.storage.from(this.bucket).remove([key]);
    if (error) {
      throw new Error(`Supabase storage delete failed: ${error.message}`);
    }
  }
}
