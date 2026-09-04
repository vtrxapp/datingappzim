import { PaymentTransactionStatus } from 'shared';

export const PAYMENT_PROVIDER = 'PAYMENT_PROVIDER';

export interface InitiatePaymentInput {
  /** Our own PaymentTransaction id, sent back to us via the provider's webhook/reference. */
  reference: string;
  amountUsd: number;
  description: string;
  /** EcoCash-registered mobile number for mobile-money Express Checkout style flows. */
  payerPhone: string;
}

export interface InitiatePaymentResult {
  status: PaymentTransactionStatus;
  providerRef?: string;
  pollUrl?: string;
  /** e.g. "Enter your EcoCash PIN on your phone to approve this payment." */
  instructions?: string;
}

export interface PaymentStatusResult {
  status: PaymentTransactionStatus;
}

/**
 * Provider-agnostic payment gateway abstraction. EcoCash via Paynow is the
 * MVP's only real implementation; OneMoney/PesePay/cards can all be added as
 * additional PaymentProvider implementations without touching
 * SubscriptionsService.
 */
export interface PaymentProvider {
  initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;
  checkStatus(pollUrl: string): Promise<PaymentStatusResult>;
}
