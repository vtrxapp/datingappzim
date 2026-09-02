import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MatchUserStatus, PLAN_CONFIG, SubscriptionPlanId, SubscriptionStatus } from 'shared';
import { PrismaService } from '../prisma/prisma.service';
import { ProfilesService } from '../profiles/profiles.service';
import { computeAge, toProfileSummaryDto } from '../profiles/profile-summary.util';
import { startOfTodayUtc } from '../common/date.util';
import { canonicalPair, scoreCandidate } from './matching-scoring.util';

const CANDIDATE_POOL_CAP = 500;

@Injectable()
export class MatchingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profilesService: ProfilesService,
  ) {}

  async getDailyBatch(userId: string) {
    const myProfile = await this.prisma.profile.findUnique({ where: { userId } });
    if (!myProfile) {
      throw new BadRequestException('Complete onboarding before viewing matches');
    }

    const quota = await this.getDailyQuota(userId);
    const todayMatches = await this.findTodaysMatches(userId);

    const remaining = quota - todayMatches.length;
    if (remaining > 0) {
      const newMatches = await this.generateIntroductions(userId, remaining);
      todayMatches.push(...newMatches);
    }

    return Promise.all(todayMatches.map((match) => this.toCandidateDto(userId, match)));
  }

  async expressInterest(userId: string, matchId: string, interested: boolean) {
    // Applies to both "Interested" and "Pass" — the product wants a completed
    // profile (photo + hobbies) before someone can act on matches at all,
    // even though seeing the daily batch itself is never gated.
    await this.profilesService.assertReadyToExpressInterest(userId);

    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      throw new NotFoundException('Match not found');
    }
    if (match.userOneId !== userId && match.userTwoId !== userId) {
      throw new NotFoundException('Match not found');
    }

    const myStatus = interested ? MatchUserStatus.INTERESTED : MatchUserStatus.PASSED;
    const isUserOne = match.userOneId === userId;
    const data = isUserOne ? { userOneStatus: myStatus } : { userTwoStatus: myStatus };

    const otherStatus = isUserOne ? match.userTwoStatus : match.userOneStatus;
    const becomesMutual = myStatus === MatchUserStatus.INTERESTED && otherStatus === MatchUserStatus.INTERESTED;

    const updated = await this.prisma.match.update({
      where: { id: matchId },
      data: { ...data, ...(becomesMutual ? { mutualAt: new Date() } : {}) },
    });

    return this.toCandidateDto(userId, updated);
  }

  /** Mutual matches — these are the chat-eligible threads. */
  async listMyMutualMatches(userId: string) {
    const matches = await this.prisma.match.findMany({
      where: { OR: [{ userOneId: userId }, { userTwoId: userId }], mutualAt: { not: null } },
      orderBy: { mutualAt: 'desc' },
    });
    return Promise.all(matches.map((match) => this.toCandidateDto(userId, match)));
  }

  /** People who are interested in me but I haven't responded to yet — gated by plan for MVP monetization. */
  async listAdmirers(userId: string) {
    const plan = await this.getPlan(userId);
    const matches = await this.prisma.match.findMany({
      where: {
        OR: [
          { userOneId: userId, userTwoStatus: MatchUserStatus.INTERESTED, userOneStatus: MatchUserStatus.PENDING },
          { userTwoId: userId, userOneStatus: MatchUserStatus.INTERESTED, userTwoStatus: MatchUserStatus.PENDING },
        ],
      },
      orderBy: { introducedAt: 'desc' },
    });

    if (!PLAN_CONFIG[plan].canSeeWhoIsInterestedFirst) {
      return { count: matches.length, profiles: [], upgradeRequired: true };
    }

    const profiles = await Promise.all(matches.map((match) => this.toCandidateDto(userId, match)));
    return { count: matches.length, profiles, upgradeRequired: false };
  }

  private async findTodaysMatches(userId: string) {
    return this.prisma.match.findMany({
      where: {
        OR: [{ userOneId: userId }, { userTwoId: userId }],
        introducedAt: { gte: startOfTodayUtc() },
      },
    });
  }

  private async getPlan(userId: string): Promise<SubscriptionPlanId> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      orderBy: { createdAt: 'desc' },
    });
    return subscription?.plan ?? SubscriptionPlanId.FREE;
  }

  private async getDailyQuota(userId: string): Promise<number> {
    const plan = await this.getPlan(userId);
    return PLAN_CONFIG[plan].dailyIntroductions;
  }

  private async generateIntroductions(userId: string, count: number) {
    const myProfile = await this.prisma.profile.findUniqueOrThrow({ where: { userId } });
    const myAge = computeAge(myProfile.dateOfBirth);

    const [blocks, existingMatches] = await Promise.all([
      this.prisma.block.findMany({ where: { OR: [{ blockerId: userId }, { blockedId: userId }] } }),
      this.prisma.match.findMany({
        where: { OR: [{ userOneId: userId }, { userTwoId: userId }] },
        select: { userOneId: true, userTwoId: true },
      }),
    ]);

    const excludedUserIds = new Set<string>([userId]);
    blocks.forEach((b) => excludedUserIds.add(b.blockerId === userId ? b.blockedId : b.blockerId));
    existingMatches.forEach((m) => excludedUserIds.add(m.userOneId === userId ? m.userTwoId : m.userOneId));

    const now = new Date();
    const maxBirthDateForMinAge = new Date(now);
    maxBirthDateForMinAge.setUTCFullYear(now.getUTCFullYear() - myProfile.seekingAgeMin);
    const minBirthDateForMaxAge = new Date(now);
    minBirthDateForMaxAge.setUTCFullYear(now.getUTCFullYear() - myProfile.seekingAgeMax - 1);

    const candidates = await this.prisma.profile.findMany({
      where: {
        userId: { notIn: Array.from(excludedUserIds) },
        gender: myProfile.seekingGender,
        seekingGender: myProfile.gender,
        seekingAgeMin: { lte: myAge },
        seekingAgeMax: { gte: myAge },
        dateOfBirth: { lte: maxBirthDateForMinAge, gte: minBirthDateForMaxAge },
        user: { status: 'ACTIVE', deletedAt: null },
      },
      take: CANDIDATE_POOL_CAP,
    });

    if (candidates.length === 0) {
      return [];
    }

    const responsesByUser = await this.prisma.questionnaireResponse.findMany({
      where: {
        userId: { in: [userId, ...candidates.map((c) => c.userId)] },
        questionKey: { in: ['CORE_VALUES', 'HOBBIES'] },
      },
    });
    const coreValuesByUser = new Map<string, string[]>();
    const hobbiesByUser = new Map<string, string[]>();
    for (const r of responsesByUser) {
      const target = r.questionKey === 'CORE_VALUES' ? coreValuesByUser : hobbiesByUser;
      target.set(r.userId, (r.answerValue as string[]) ?? []);
    }
    const myCoreValues = coreValuesByUser.get(userId) ?? [];
    const myHobbies = hobbiesByUser.get(userId) ?? [];

    const scored = candidates
      .map((candidate) => ({
        candidate,
        score: scoreCandidate({
          myCity: myProfile.city,
          myAge,
          myCoreValues,
          myHobbies,
          candidateCity: candidate.city,
          candidateAge: computeAge(candidate.dateOfBirth),
          candidateCoreValues: coreValuesByUser.get(candidate.userId) ?? [],
          candidateHobbies: hobbiesByUser.get(candidate.userId) ?? [],
          candidateVerificationStatus: candidate.verificationStatus,
        }),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, count);

    return Promise.all(
      scored.map(({ candidate, score }) => {
        const [userOneId, userTwoId] = canonicalPair(userId, candidate.userId);
        return this.prisma.match.create({ data: { userOneId, userTwoId, score } });
      }),
    );
  }

  private async toCandidateDto(userId: string, match: {
    id: string;
    userOneId: string;
    userTwoId: string;
    userOneStatus: MatchUserStatus;
    userTwoStatus: MatchUserStatus;
    score: number;
    introducedAt: Date;
    mutualAt: Date | null;
  }) {
    const isUserOne = match.userOneId === userId;
    const otherUserId = isUserOne ? match.userTwoId : match.userOneId;
    const myStatus = isUserOne ? match.userOneStatus : match.userTwoStatus;
    const theirStatus = isUserOne ? match.userTwoStatus : match.userOneStatus;

    const otherProfile = await this.prisma.profile.findUniqueOrThrow({
      where: { userId: otherUserId },
      include: { photos: true },
    });
    const otherResponses = await this.prisma.questionnaireResponse.findMany({ where: { userId: otherUserId } });

    return {
      matchId: match.id,
      profile: toProfileSummaryDto(otherUserId, otherProfile, otherResponses),
      score: match.score,
      myStatus,
      theirStatus,
      isMutual: match.mutualAt !== null,
      introducedAt: match.introducedAt.toISOString(),
    };
  }
}
