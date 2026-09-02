import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { SafetyController } from './safety.controller';
import { SafetyService } from './safety.service';

@Module({
  imports: [NotificationsModule],
  controllers: [SafetyController],
  providers: [SafetyService],
})
export class SafetyModule {}
