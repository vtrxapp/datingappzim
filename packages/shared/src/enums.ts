/**
 * These are modeled as `const` objects + derived union types (not `enum`)
 * so they are *structurally* compatible with Prisma's own generated enum
 * types in apps/api. Prisma generates the same const-object pattern and
 * TypeScript compares string-literal unions structurally but real `enum`
 * declarations nominally. Using `enum` here would force casts at every
 * Prisma <-> shared boundary in the backend.
 *
 * MVP scope decision: heterosexual matching only (man seeking woman / woman
 * seeking man). Gender and SeekingGender are deliberately modeled as single
 * values, not arrays, to keep that scope explicit. If this is revisited later,
 * extend both and change `seekingGender` on Profile to an array without
 * needing to touch unrelated modules. Matching filters are centralized in
 * apps/api/src/matching/matching.service.ts.
 */
export const Gender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
} as const;
export type Gender = (typeof Gender)[keyof typeof Gender];

export type SeekingGender = Gender;

export const City = {
  HARARE: 'HARARE',
  BULAWAYO: 'BULAWAYO',
  OTHER: 'OTHER',
} as const;
export type City = (typeof City)[keyof typeof City];

/** Only MARRIAGE exists in the MVP; kept as a config value so casual/dating
 * intents are an addition, not a schema migration, if ever added post-launch. */
export const RelationshipIntent = {
  MARRIAGE: 'MARRIAGE',
} as const;
export type RelationshipIntent = (typeof RelationshipIntent)[keyof typeof RelationshipIntent];

export const VerificationStatus = {
  UNVERIFIED: 'UNVERIFIED',
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
} as const;
export type VerificationStatus = (typeof VerificationStatus)[keyof typeof VerificationStatus];

export const UserRole = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  DEACTIVATED: 'DEACTIVATED',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

/** Per-side status within a curated introduction (Match row). */
export const MatchUserStatus = {
  PENDING: 'PENDING',
  INTERESTED: 'INTERESTED',
  PASSED: 'PASSED',
} as const;
export type MatchUserStatus = (typeof MatchUserStatus)[keyof typeof MatchUserStatus];

export const ReportReason = {
  FAKE_PROFILE: 'FAKE_PROFILE',
  INAPPROPRIATE_MESSAGES: 'INAPPROPRIATE_MESSAGES',
  INAPPROPRIATE_PHOTOS: 'INAPPROPRIATE_PHOTOS',
  HARASSMENT: 'HARASSMENT',
  SCAM_OR_SOLICITATION: 'SCAM_OR_SOLICITATION',
  UNDERAGE: 'UNDERAGE',
  OTHER: 'OTHER',
} as const;
export type ReportReason = (typeof ReportReason)[keyof typeof ReportReason];

export const ReportStatus = {
  PENDING: 'PENDING',
  REVIEWED: 'REVIEWED',
  ACTIONED: 'ACTIONED',
  DISMISSED: 'DISMISSED',
} as const;
export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

export const SafetyCheckinStatus = {
  SCHEDULED: 'SCHEDULED',
  CONFIRMED_SAFE: 'CONFIRMED_SAFE',
  MISSED: 'MISSED',
  CANCELLED: 'CANCELLED',
} as const;
export type SafetyCheckinStatus = (typeof SafetyCheckinStatus)[keyof typeof SafetyCheckinStatus];

export const SubscriptionPlanId = {
  FREE: 'FREE',
  PREMIUM: 'PREMIUM',
} as const;
export type SubscriptionPlanId = (typeof SubscriptionPlanId)[keyof typeof SubscriptionPlanId];

export const SubscriptionStatus = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
  PENDING_PAYMENT: 'PENDING_PAYMENT',
} as const;
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export const PaymentProviderId = {
  MOCK: 'MOCK',
  PAYNOW: 'PAYNOW',
} as const;
export type PaymentProviderId = (typeof PaymentProviderId)[keyof typeof PaymentProviderId];

export const PaymentTransactionStatus = {
  CREATED: 'CREATED',
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;
export type PaymentTransactionStatus = (typeof PaymentTransactionStatus)[keyof typeof PaymentTransactionStatus];
