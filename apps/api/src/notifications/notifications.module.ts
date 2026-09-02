import { Module } from '@nestjs/common';
import { MESSAGING_PROVIDER } from './messaging-provider.interface';
import { MockMessagingProvider } from './providers/mock-messaging.provider';
import { NotificationsService } from './notifications.service';

@Module({
  providers: [
    {
      // SMS_PROVIDER currently only supports "mock" — swap this factory to
      // return a real gateway implementation (Twilio, Africa's Talking,
      // WhatsApp Business API) once a provider is contracted.
      provide: MESSAGING_PROVIDER,
      useClass: MockMessagingProvider,
    },
    NotificationsService,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
