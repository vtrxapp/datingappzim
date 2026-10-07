import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessagingProvider } from '../messaging-provider.interface';

interface AfricasTalkingRecipient {
  number: string;
  status: string;
  statusCode: number;
  cost?: string;
  messageId?: string;
}

interface AfricasTalkingResponse {
  SMSMessageData?: {
    Message?: string;
    Recipients?: AfricasTalkingRecipient[];
  };
}

/**
 * Real SMS gateway via Africa's Talking, chosen for its Econet/NetOne/Telecel
 * delivery coverage in Zimbabwe specifically. Defaults to their sandbox
 * endpoint (api.sandbox.africastalking.com) until AT_SANDBOX is explicitly
 * set to "false", so a misconfigured deploy fails loud in the sandbox
 * instead of silently sending/billing real messages.
 *
 * API shape (POST, form-encoded, apiKey header) is Africa's Talking's
 * long-stable, widely-documented Bulk SMS endpoint. Still worth one real
 * sandbox send before relying on it for production OTPs — sandbox delivery
 * requires the test phone number to be added as a simulator recipient in
 * the Africa's Talking dashboard first.
 */
@Injectable()
export class AfricasTalkingMessagingProvider implements MessagingProvider {
  private readonly logger = new Logger(AfricasTalkingMessagingProvider.name);
  private readonly baseUrl: string;
  private readonly username: string;
  private readonly apiKey: string;
  private readonly senderId?: string;

  constructor(private readonly configService: ConfigService) {
    const sandbox = this.configService.get<boolean>('sms.africastalking.sandbox') ?? true;
    this.baseUrl = sandbox
      ? 'https://api.sandbox.africastalking.com/version1/messaging'
      : 'https://api.africastalking.com/version1/messaging';
    this.username = this.configService.get<string>('sms.africastalking.username')!;
    this.apiKey = this.configService.get<string>('sms.africastalking.apiKey')!;
    this.senderId = this.configService.get<string>('sms.africastalking.senderId') || undefined;
  }

  async send(toPhone: string, message: string): Promise<void> {
    const body = new URLSearchParams({
      username: this.username,
      to: toPhone,
      message,
      ...(this.senderId ? { from: this.senderId } : {}),
    });

    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        apiKey: this.apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: body.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`Africa's Talking HTTP ${res.status}: ${text}`);
      throw new Error('SMS provider request failed');
    }

    const json = (await res.json()) as AfricasTalkingResponse;
    const recipient = json.SMSMessageData?.Recipients?.[0];
    if (!recipient || recipient.statusCode !== 101) {
      this.logger.error(`Africa's Talking send failed for ${toPhone}: ${JSON.stringify(json)}`);
      throw new Error(recipient?.status ?? 'SMS provider rejected the message');
    }
  }
}
