import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { STORAGE_PROVIDER } from './storage-provider.interface';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { R2StorageProvider } from './providers/r2-storage.provider';
import { ImageCompressionService } from './image-compression.service';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';

@Module({
  controllers: [StorageController],
  providers: [
    {
      provide: STORAGE_PROVIDER,
      useFactory: (configService: ConfigService) =>
        configService.get('storage.provider') === 'r2'
          ? new R2StorageProvider(configService)
          : new LocalStorageProvider(),
      inject: [ConfigService],
    },
    ImageCompressionService,
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule {}
