import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { PaymentTransactionStatus } from 'shared';
import {
  InitiatePaymentInput,
  InitiatePaymentResult,
  PaymentProvider,
  PaymentStatusResult,
} from '../payment-provider.interface';

const PAYNOW_REMOTE_TRANSACTION_URL = 'https://www.paynow.co.zw/interface/remotetransaction';

/**
 * Real EcoCash-via-Paynow integration, using Paynow's Express Checkout
 * ("remote transaction") flow so the user approves the payment as a USSD/app
 * prompt on their own phone rather than being redirected to a web page.
 *
 * IMPORTANT: developers.paynow.co.zw was not reachable from this sandbox
 * (egress-blocked) while building this, so the request/response field names
 * and the hash algorithm below are implemented from Paynow's long-documented,
 * widely-mirrored integration pattern (used by their own PHP/Node SDKs), not
 * a live fetch of the current docs. Verify against
 * https://developers.paynow.co.zw and a real sandbox integration ID/key
 * before taking any real payment.
 */
@Injectable()
export class PaynowPaymentProvider implements PaymentProvider {
  private readonly logger = new Logger(PaynowPaymentProvider.name);

  constructor(private readonly configService: ConfigService) {}

  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const fields: Record<string, string> = {
      id: this.configService.get<string>('payment.paynow.integrationId')!,
      reference: input.reference,
      amount: input.amountUsd.toFixed(2),
      additionalinfo: input.description,
      returnurl: this.configService.get<string>('payment.paynow.returnUrl')!,
      resulturl: this.configService.get<string>('payment.paynow.resultUrl')!,
      authemail: `${input.payerPhone.replace('+', '')}@sms.tariro.local`,
      phone: input.payerPhone,
      method: 'ecocash',
      status: 'Message',
    };

    const response = await this.postForm(PAYNOW_REMOTE_TRANSACTION_URL, fields);

    if (response.status?.toLowerCase() !== 'ok') {
      this.logger.error(`Paynow initiate failed: ${response.error ?? 'unknown error'}`);
      throw new ServiceUnavailableException('Payment provider could not start this transaction');
    }

    return {
      status: PaymentTransactionStatus.PENDING,
      providerRef: response.paynowreference,
      pollUrl: response.pollurl,
      instructions: response.instructions ?? 'Approve the EcoCash prompt sent to your phone.',
    };
  }

  async checkStatus(pollUrl: string): Promise<PaymentStatusResult> {
    const response = await this.postForm(pollUrl, {});
    return { status: this.mapStatus(response.status) };
  }

  private mapStatus(paynowStatus?: string): PaymentTransactionStatus {
    switch ((paynowStatus ?? '').toLowerCase()) {
      case 'paid':
      case 'awaiting delivery':
      case 'delivered':
        return PaymentTransactionStatus.PAID;
      case 'cancelled':
        return PaymentTransactionStatus.CANCELLED;
      case 'disputed':
      case 'refunded':
        return PaymentTransactionStatus.FAILED;
      default:
        return PaymentTransactionStatus.PENDING;
    }
  }

  /** Concatenate field VALUES in a fixed order, append the (never-transmitted) integration
   * key, then SHA512-hex-uppercase. Paynow's documented hash scheme for both requests and
   * verifying responses. */
  private hash(values: string[]): string {
    const integrationKey = this.configService.get<string>('payment.paynow.integrationKey')!;
    return createHash('sha512')
      .update(values.join('') + integrationKey)
      .digest('hex')
      .toUpperCase();
  }

  private async postForm(url: string, fields: Record<string, string>): Promise<Record<string, string>> {
    const withHash = { ...fields };
    if (Object.keys(fields).length > 0) {
      withHash.hash = this.hash(Object.values(fields));
    }

    const body = new URLSearchParams(withHash).toString();
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const text = await res.text();
    return Object.fromEntries(new URLSearchParams(text).entries());
  }
}
