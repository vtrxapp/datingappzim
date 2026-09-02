import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PLAN_CONFIG, PaymentProviderId, PaymentTransactionStatus, SubscriptionPlanId, SubscriptionStatus } from 'shared';
import { PrismaService } from '../prisma/prisma.service';
import { startOfTodayUtc } from '../common/date.util';
import { PAYMENT_PROVIDER, PaymentProvider } from './payments/payment-provider.interface';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Inject(PAYMENT_PROVIDER) private readonly paymentProvider: PaymentProvider,
  ) {}

  async getMyState(userId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      orderBy: { createdAt: 'desc' },
    });
    const plan = subscription?.plan ?? SubscriptionPlanId.FREE;
    const planConfig = PLAN_CONFIG[plan];

    const todaysMatchCount = await this.prisma.match.count({
      where: { OR: [{ userOneId: userId }, { userTwoId: userId }], introducedAt: { gte: startOfTodayUtc() } },
    });

    return {
      plan,
      status: subscription?.status ?? SubscriptionStatus.ACTIVE,
      expiresAt: subscription?.expiresAt?.toISOString() ?? null,
      dailyIntroductionsRemaining: Math.max(0, planConfig.dailyIntroductions - todaysMatchCount),
      canSeeWhoIsInterestedFirst: planConfig.canSeeWhoIsInterestedFirst,
    };
  }

  async initiatePremiumUpgrade(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    const pendingSubscription = await this.prisma.subscription.findFirst({
      where: { userId, plan: SubscriptionPlanId.PREMIUM, status: SubscriptionStatus.PENDING_PAYMENT },
      include: { paymentTransactions: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (pendingSubscription?.paymentTransactions[0]?.pollUrl) {
      const tx = pendingSubscription.paymentTransactions[0];
      return { subscriptionId: pendingSubscription.id, paymentTransactionId: tx.id, pollUrl: tx.pollUrl };
    }

    const planConfig = PLAN_CONFIG[SubscriptionPlanId.PREMIUM];
    const subscription = await this.prisma.subscription.create({
      data: { userId, plan: SubscriptionPlanId.PREMIUM, status: SubscriptionStatus.PENDING_PAYMENT },
    });
    const providerId =
      this.configService.get<string>('payment.provider') === 'paynow' ? PaymentProviderId.PAYNOW : PaymentProviderId.MOCK;
    const transaction = await this.prisma.paymentTransaction.create({
      data: {
        subscriptionId: subscription.id,
        provider: providerId,
        amountUsd: planConfig.priceUsd,
        status: PaymentTransactionStatus.CREATED,
      },
    });

    const result = await this.paymentProvider.initiate({
      reference: transaction.id,
      amountUsd: planConfig.priceUsd,
      description: `${planConfig.label} subscription — DatingAppZim`,
      payerPhone: user.phone,
    });

    const updated = await this.prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: result.status,
        providerRef: result.providerRef,
        pollUrl: result.pollUrl,
        rawPayload: result as unknown as object,
      },
    });

    return {
      subscriptionId: subscription.id,
      paymentTransactionId: updated.id,
      pollUrl: updated.pollUrl,
      instructions: result.instructions,
    };
  }

  async checkPaymentStatus(userId: string, paymentTransactionId: string) {
    const transaction = await this.prisma.paymentTransaction.findUnique({
      where: { id: paymentTransactionId },
      include: { subscription: true },
    });
    if (!transaction || transaction.subscription.userId !== userId) {
      throw new NotFoundException('Payment not found');
    }

    if (transaction.status === PaymentTransactionStatus.PAID || !transaction.pollUrl) {
      return { status: transaction.status };
    }

    const { status } = await this.paymentProvider.checkStatus(transaction.pollUrl);
    await this.prisma.paymentTransaction.update({ where: { id: transaction.id }, data: { status } });

    if (status === PaymentTransactionStatus.PAID) {
      await this.activateSubscription(transaction.subscriptionId);
    }

    return { status };
  }

  /** Paynow's server-to-server resulturl callback. NOTE: does not yet verify Paynow's
   * response hash (see PaynowPaymentProvider's header comment on why that was not safe
   * to implement without live access to the current docs) — treat this as a convenience
   * fast-path on top of the authoritative poll-based checkPaymentStatus, and add
   * signature verification here before accepting real payments. */
  async handleWebhook(payload: Record<string, string>) {
    const transaction = await this.prisma.paymentTransaction.findUnique({ where: { id: payload.reference } });
    if (!transaction) {
      this.logger.warn(`Webhook for unknown payment reference: ${payload.reference}`);
      return;
    }

    const status = this.mapPaynowStatus(payload.status);
    await this.prisma.paymentTransaction.update({ where: { id: transaction.id }, data: { status } });

    if (status === PaymentTransactionStatus.PAID) {
      await this.activateSubscription(transaction.subscriptionId);
    }
  }

  private mapPaynowStatus(paynowStatus?: string): PaymentTransactionStatus {
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

  private async activateSubscription(subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUniqueOrThrow({ where: { id: subscriptionId } });
    if (subscription.status === SubscriptionStatus.ACTIVE) return;

    const planConfig = PLAN_CONFIG[subscription.plan];
    const expiresAt = new Date();
    expiresAt.setUTCDate(expiresAt.getUTCDate() + planConfig.billingPeriodDays);

    await this.prisma.$transaction([
      this.prisma.subscription.updateMany({
        where: { userId: subscription.userId, status: SubscriptionStatus.ACTIVE },
        data: { status: SubscriptionStatus.CANCELLED },
      }),
      this.prisma.subscription.update({
        where: { id: subscriptionId },
        data: { status: SubscriptionStatus.ACTIVE, startedAt: new Date(), expiresAt },
      }),
    ]);
  }
}
