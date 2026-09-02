import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type Redis from 'ioredis';
import { PaymentTransactionStatus } from 'shared';
import { REDIS_CLIENT } from '../../../redis/redis.module';
import {
  InitiatePaymentInput,
  InitiatePaymentResult,
  PaymentProvider,
  PaymentStatusResult,
} from '../payment-provider.interface';

const AUTO_SETTLE_DELAY_MS = 5000;
const MOCK_POLL_PREFIX = 'mockpayment:';

/**
 * Local-dev stand-in for Paynow. "Approves" the payment a few seconds after
 * initiation (like a person confirming an EcoCash PIN prompt) so the
 * frontend's real polling UX can be exercised without any provider account.
 */
@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async initiate(_input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const pollId = randomUUID();
    const pollUrl = `mock://poll/${pollId}`;
    await this.redis.set(`${MOCK_POLL_PREFIX}${pollId}`, PaymentTransactionStatus.PENDING, 'EX', 3600);

    setTimeout(() => {
      this.redis.set(`${MOCK_POLL_PREFIX}${pollId}`, PaymentTransactionStatus.PAID, 'EX', 3600).catch(() => {});
    }, AUTO_SETTLE_DELAY_MS);

    return {
      status: PaymentTransactionStatus.PENDING,
      providerRef: pollId,
      pollUrl,
      instructions: 'Mock payment: this will auto-approve in a few seconds, as if you confirmed on your phone.',
    };
  }

  async checkStatus(pollUrl: string): Promise<PaymentStatusResult> {
    const pollId = pollUrl.replace('mock://poll/', '');
    const status = (await this.redis.get(`${MOCK_POLL_PREFIX}${pollId}`)) as PaymentTransactionStatus | null;
    return { status: status ?? PaymentTransactionStatus.PENDING };
  }
}
