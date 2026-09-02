import { Injectable, NotFoundException } from '@nestjs/common';
import { ReportStatus, VerificationStatus } from 'shared';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  listReports(status?: ReportStatus) {
    return this.prisma.report.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'asc' },
      include: {
        reporter: { include: { profile: true } },
        reportedUser: { include: { profile: true } },
      },
    });
  }

  async resolveReport(
    adminId: string,
    reportId: string,
    status: typeof ReportStatus.REVIEWED | typeof ReportStatus.ACTIONED | typeof ReportStatus.DISMISSED,
  ) {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (status === ReportStatus.ACTIONED) {
      // MVP's concrete moderation action: deactivate the offending account.
      // History (messages, past matches) is preserved via soft-delete, not erased.
      await this.usersService.deactivate(report.reportedUserId);
    }

    return this.prisma.report.update({
      where: { id: reportId },
      data: { status, reviewedByAdminId: adminId, reviewedAt: new Date() },
    });
  }

  listPendingVerifications() {
    return this.prisma.profile.findMany({
      where: { verificationStatus: VerificationStatus.PENDING },
      orderBy: { updatedAt: 'asc' },
    });
  }

  async reviewVerification(profileId: string, approve: boolean) {
    const profile = await this.prisma.profile.findUnique({ where: { id: profileId } });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return this.prisma.profile.update({
      where: { id: profileId },
      data: { verificationStatus: approve ? VerificationStatus.VERIFIED : VerificationStatus.REJECTED },
    });
  }
}
