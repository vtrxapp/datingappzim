import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MESSAGING_PROVIDER } from './messaging-provider.interface';
import { MockMessagingProvider } from './providers/mock-messaging.provider';
import { AfricasTalkingMessagingProvider } from './providers/africas-talking-messaging.provider';
import { NotificationsService } from './notifications.service';

@Module({
  providers: [
    {
      provide: MESSAGING_PROVIDER,
      useFactory: (configService: ConfigService) =>
        configService.get('sms.provider') === 'africastalking'
          ? new AfricasTalkingMessagingProvider(configService)
          : new MockMessagingProvider(),
      inject: [ConfigService],
    },
    NotificationsService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
