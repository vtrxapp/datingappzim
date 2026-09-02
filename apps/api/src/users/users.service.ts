import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole, UserStatus } from 'shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  findActiveByPhone(phone: string) {
    return this.prisma.user.findFirst({ where: { phone, deletedAt: null } });
  }

  findById(id: string) {
    return this.prisma.user.findFirst({ where: { id, deletedAt: null } });
  }

  /**
   * Finds the user for this phone (reactivating a soft-deleted account if
   * one exists, per the "never hard-delete on account closure" rule) or
   * creates a brand-new one. Returns the user plus whether it was newly
   * created, so the caller can route to onboarding.
   */
  async findOrCreateByPhone(phone: string) {
    const existing = await this.prisma.user.findUnique({ where: { phone } });

    if (existing && !existing.deletedAt) {
      return { user: existing, isNewUser: false };
    }

    if (existing && existing.deletedAt) {
      const reactivated = await this.prisma.user.update({
        where: { id: existing.id },
        data: { deletedAt: null, status: UserStatus.ACTIVE },
      });
      return { user: reactivated, isNewUser: false };
    }

    const adminBootstrapPhone = this.configService.get<string | null>('adminBootstrapPhone');
    const role = adminBootstrapPhone && phone === adminBootstrapPhone ? UserRole.ADMIN : UserRole.USER;

    const created = await this.prisma.user.create({
      data: { phone, role, phoneVerifiedAt: new Date() },
    });
    return { user: created, isNewUser: true };
  }

  markPhoneVerified(userId: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { phoneVerifiedAt: new Date() } });
  }

  markOnboardingComplete(userId: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { onboardingComplete: true } });
  }

  /** Soft-delete only — message/match/report history is preserved for safety and audit purposes. */
  deactivate(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date(), status: UserStatus.DEACTIVATED },
    });
  }
}
