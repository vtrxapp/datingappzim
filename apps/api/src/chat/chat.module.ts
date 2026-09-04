import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { MatchingModule } from '../matching/matching.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [StorageModule, MatchingModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
