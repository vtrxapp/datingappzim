import {
  City,
  Gender,
  MatchUserStatus,
  ReportReason,
  SafetyCheckinStatus,
  SubscriptionPlanId,
  SubscriptionStatus,
  VerificationStatus,
} from './enums';

/** Shape returned to a client viewing another user's profile (never includes phone). */
export interface ProfileSummaryDto {
  userId: string;
  displayName: string;
  age: number;
  city: City;
  bio: string | null;
  photos: string[];
  verificationStatus: VerificationStatus;
  aboutAnswers: { key: string; label: string; value: string }[];
}

export interface MatchCandidateDto {
  matchId: string;
  profile: ProfileSummaryDto;
  score: number;
  myStatus: MatchUserStatus;
  theirStatus: MatchUserStatus;
  isMutual: boolean;
  introducedAt: string;
  /** A short note sent alongside Interested (Premium only), from me to them. */
  myNote: string | null;
  /** The note they sent alongside their Interested, if any. */
  theirNote: string | null;
}

export interface MessageReplyPreviewDto {
  id: string;
  senderId: string;
  content: string | null;
  imageUrl: string | null;
}

export interface MessageDto {
  id: string;
  matchId: string;
  senderId: string;
  content: string | null;
  imageUrl: string | null;
  createdAt: string;
  readAt: string | null;
  /** The message this one is a swipe-to-reply response to, if any. */
  replyTo: MessageReplyPreviewDto | null;
}

export interface SafetyCheckinDto {
  id: string;
  matchId: string | null;
  safetyContactName: string;
  safetyContactPhone: string;
  meetingTime: string;
  checkinTime: string;
  status: SafetyCheckinStatus;
}

export interface CreateReportDto {
  reportedUserId: string;
  matchId?: string;
  reason: ReportReason;
  details?: string;
}

export interface SubscriptionStateDto {
  plan: SubscriptionPlanId;
  status: SubscriptionStatus;
  expiresAt: string | null;
  dailyIntroductionsRemaining: number;
}

export interface AuthTokensIssuedDto {
  userId: string;
  isNewUser: boolean;
  onboardingComplete: boolean;
}

export interface MeDto {
  userId: string;
  phone: string;
  role: 'USER' | 'ADMIN';
  onboardingComplete: boolean;
}

/** Whether a user has enough of a profile (photo + hobbies) to act on matches. */
export interface ProfileReadinessDto {
  hasPhoto: boolean;
  hasHobbies: boolean;
  ready: boolean;
}

export { Gender };
