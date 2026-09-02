import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { City, Gender, RelationshipIntent, VerificationStatus } from 'shared';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { toProfileSummaryDto } from './profile-summary.util';

export interface CreateProfileInput {
  displayName: string;
  dateOfBirth: Date;
  gender: Gender;
  seekingGender: Gender;
  city: City;
  seekingAgeMin: number;
  seekingAgeMax: number;
}

const MAX_PHOTOS = 6;

@Injectable()
export class ProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  findByUserId(userId: string) {
    return this.prisma.profile.findUnique({ where: { userId }, include: { photos: true } });
  }

  async createFromOnboarding(userId: string, input: CreateProfileInput) {
    const existing = await this.prisma.profile.findUnique({ where: { userId } });
    if (existing) {
      return this.prisma.profile.update({
        where: { userId },
        data: { ...input, relationshipIntent: RelationshipIntent.MARRIAGE },
        include: { photos: true },
      });
    }
    return this.prisma.profile.create({
      data: { userId, ...input, relationshipIntent: RelationshipIntent.MARRIAGE },
      include: { photos: true },
    });
  }

  async updateBio(userId: string, bio: string) {
    await this.assertOwnsProfile(userId);
    return this.prisma.profile.update({ where: { userId }, data: { bio } });
  }

  async addPhoto(userId: string, fileBuffer: Buffer) {
    const profile = await this.assertOwnsProfile(userId);
    if (profile.photos.length >= MAX_PHOTOS) {
      throw new BadRequestException(`You can only have up to ${MAX_PHOTOS} photos`);
    }
    const nextPosition = profile.photos.reduce((max, p) => Math.max(max, p.position), -1) + 1;
    const { url } = await this.storageService.uploadCompressedImage(`profiles/${profile.id}`, fileBuffer);
    return this.prisma.profilePhoto.create({ data: { profileId: profile.id, url, position: nextPosition } });
  }

  async removePhoto(userId: string, photoId: string) {
    const profile = await this.assertOwnsProfile(userId);
    const photo = profile.photos.find((p) => p.id === photoId);
    if (!photo) {
      throw new NotFoundException('Photo not found');
    }
    await this.prisma.profilePhoto.delete({ where: { id: photoId } });
  }

  async submitVerificationDocument(userId: string, fileBuffer: Buffer, contentType: string) {
    const profile = await this.assertOwnsProfile(userId);
    if (profile.verificationStatus === VerificationStatus.PENDING || profile.verificationStatus === VerificationStatus.VERIFIED) {
      throw new BadRequestException('Verification is already pending or approved');
    }
    // Compressed like any other photo: the ID photo just needs to be legible for
    // manual admin review, not full resolution, and this keeps upload bandwidth low.
    const { url } = await this.storageService.uploadCompressedImage(`verification/${profile.id}`, fileBuffer);
    return this.prisma.profile.update({
      where: { userId },
      data: { verificationStatus: VerificationStatus.PENDING, verificationDocumentUrl: url },
    });
  }

  /**
   * At least one photo and one hobby are required before a user can act on a
   * match (Interested or Pass) — a deliberate product decision to nudge
   * profile completion once someone has already seen real matches, without
   * gating onboarding itself (they still see their first batch immediately).
   */
  async getMatchingReadiness(userId: string): Promise<{ hasPhoto: boolean; hasHobbies: boolean; ready: boolean }> {
    const profile = await this.prisma.profile.findUnique({ where: { userId }, include: { photos: true } });
    const hasPhoto = (profile?.photos.length ?? 0) > 0;

    const hobbiesResponse = await this.prisma.questionnaireResponse.findUnique({
      where: { userId_questionKey: { userId, questionKey: 'HOBBIES' } },
    });
    const hobbies = (hobbiesResponse?.answerValue as string[] | undefined) ?? [];
    const hasHobbies = hobbies.length > 0;

    return { hasPhoto, hasHobbies, ready: hasPhoto && hasHobbies };
  }

  async assertReadyToExpressInterest(userId: string): Promise<void> {
    const readiness = await this.getMatchingReadiness(userId);
    if (!readiness.hasPhoto) {
      throw new BadRequestException('Add a profile photo before responding to matches');
    }
    if (!readiness.hasHobbies) {
      throw new BadRequestException('Add at least one hobby before responding to matches');
    }
  }

  async getProfileSummaryForViewer(targetUserId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId: targetUserId },
      include: { photos: true },
    });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    const responses = await this.prisma.questionnaireResponse.findMany({ where: { userId: targetUserId } });
    return toProfileSummaryDto(targetUserId, profile, responses);
  }

  private async assertOwnsProfile(userId: string) {
    const profile = await this.prisma.profile.findUnique({ where: { userId }, include: { photos: true } });
    if (!profile) {
      throw new ForbiddenException('Complete onboarding before managing your profile');
    }
    return profile;
  }
}
