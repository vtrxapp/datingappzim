export const MESSAGING_PROVIDER = 'MESSAGING_PROVIDER';

/**
 * Generic outbound text-message channel. OTP codes and safety-contact alerts
 * both just need "send this phone number this text", real implementations
 * (Twilio, an Africa's Talking-style SMS gateway, WhatsApp Business API)
 * plug in here without callers changing.
 */
export interface MessagingProvider {
  send(toPhone: string, message: string): Promise<void>;
}
