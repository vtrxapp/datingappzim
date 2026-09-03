import { SubscriptionPlanId } from './enums';

/**
 * Pricing/entitlement config for subscription plans. Intentionally NOT
 * hardcoded elsewhere — read this at runtime so pricing/quotas can be tuned
 * without a code change. USD is used because EcoCash/Paynow settlement and
 * most Zimbabwean digital subscriptions are priced in USD to avoid local
 * currency volatility; adjust here if that assumption changes.
 */
export interface PlanConfig {
  id: SubscriptionPlanId;
  label: string;
  priceUsd: number;
  billingPeriodDays: number;
  dailyIntroductions: number;
  /** How many of your admirers you can see, most-recent-first; null = everyone. */
  maxVisibleAdmirers: number | null;
  /** Whether you can attach a short note when saying Interested, before the other person responds. */
  canSendInterestNote: boolean;
}

export const PLAN_CONFIG: Record<SubscriptionPlanId, PlanConfig> = {
  [SubscriptionPlanId.FREE]: {
    id: SubscriptionPlanId.FREE,
    label: 'Free',
    priceUsd: 0,
    billingPeriodDays: 0,
    dailyIntroductions: 3,
    maxVisibleAdmirers: 5,
    canSendInterestNote: false,
  },
  [SubscriptionPlanId.PREMIUM]: {
    id: SubscriptionPlanId.PREMIUM,
    label: 'Premium',
    priceUsd: 4.99,
    billingPeriodDays: 30,
    dailyIntroductions: 10,
    maxVisibleAdmirers: null,
    canSendInterestNote: true,
  },
};

export function getPlanConfig(planId: SubscriptionPlanId): PlanConfig {
  return PLAN_CONFIG[planId];
}
