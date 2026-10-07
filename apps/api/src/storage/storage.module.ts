import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { STORAGE_PROVIDER } from './storage-provider.interface';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { R2StorageProvider } from './providers/r2-storage.provider';
import { SupabaseStorageProvider } from './providers/supabase-storage.provider';
import { ImageCompressionService } from './image-compression.service';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';

@Module({
  controllers: [StorageController],
  providers: [
    {
      provide: STORAGE_PROVIDER,
      useFactory: (configService: ConfigService) => {
        switch (configService.get('storage.provider')) {
          case 'r2':
            return new R2StorageProvider(configService);
          case 'supabase':
            return new SupabaseStorageProvider(configService);
          default:
            return new LocalStorageProvider();
        }
      },
      inject: [ConfigService],
    },
    ImageCompressionService,
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule {}
