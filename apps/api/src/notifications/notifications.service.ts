import { Inject, Injectable } from '@nestjs/common';
import { MESSAGING_PROVIDER, MessagingProvider } from './messaging-provider.interface';

@Injectable()
export class NotificationsService {
  constructor(@Inject(MESSAGING_PROVIDER) private readonly provider: MessagingProvider) {}

  sendOtpCode(phone: string, code: string): Promise<void> {
    return this.provider.send(phone, `Your verification code is ${code}. It expires in 5 minutes.`);
  }

  sendSafetyAlert(contactPhone: string, userDisplayName: string, meetingTime: Date): Promise<void> {
    const when = meetingTime.toLocaleString('en-ZW', { dateStyle: 'medium', timeStyle: 'short' });
    return this.provider.send(
      contactPhone,
      `${userDisplayName} asked you to be their safety contact for a meet-up on ${when}. ` +
        `We'll text you again if they don't check in as safe afterwards.`,
    );
  }

  sendMissedCheckinAlert(contactPhone: string, userDisplayName: string): Promise<void> {
    return this.provider.send(
      contactPhone,
      `${userDisplayName} has not checked in as safe after their planned meet-up. ` +
        `Please try to reach them.`,
    );
  }
}
