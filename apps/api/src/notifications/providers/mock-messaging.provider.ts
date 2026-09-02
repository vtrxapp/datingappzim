import { Injectable, Logger } from '@nestjs/common';
import { MessagingProvider } from '../messaging-provider.interface';

/**
 * Local-dev stand-in for a real SMS/WhatsApp gateway. Logs to the API
 * console instead of sending anything, so OTP codes and safety alerts are
 * visible during development without a paid provider account.
 */
@Injectable()
export class MockMessagingProvider implements MessagingProvider {
  private readonly logger = new Logger('MockMessagingProvider');

  async send(toPhone: string, message: string): Promise<void> {
    this.logger.log(`[MOCK SMS -> ${toPhone}] ${message}`);
  }
}
