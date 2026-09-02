import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';
import { PAYMENT_PROVIDER } from './payments/payment-provider.interface';
import { MockPaymentProvider } from './payments/providers/mock-payment.provider';
import { PaynowPaymentProvider } from './payments/providers/paynow-payment.provider';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  controllers: [SubscriptionsController],
  providers: [
    {
      provide: PAYMENT_PROVIDER,
      useFactory: (configService: ConfigService, redis: Redis) =>
        configService.get('payment.provider') === 'paynow'
          ? new PaynowPaymentProvider(configService)
          : new MockPaymentProvider(redis),
      inject: [ConfigService, REDIS_CLIENT],
    },
    SubscriptionsService,
  ],
})
export class SubscriptionsModule {}
