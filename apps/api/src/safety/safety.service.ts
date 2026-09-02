import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SafetyCheckinStatus } from 'shared';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateCheckinDto } from './dto/create-checkin.dto';

@Injectable()
export class SafetyService {
  private readonly logger = new Logger(SafetyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createCheckin(userId: string, dto: CreateCheckinDto) {
    const meetingTime = new Date(dto.meetingTime);
    const checkinTime = new Date(dto.checkinTime);
    if (checkinTime <= meetingTime) {
      throw new BadRequestException('checkinTime must be after meetingTime');
    }

    const profile = await this.prisma.profile.findUniqueOrThrow({ where: { userId } });

    const checkin = await this.prisma.safetyCheckin.create({
      data: {
        userId,
        matchId: dto.matchId,
        safetyContactName: dto.safetyContactName,
        safetyContactPhone: dto.safetyContactPhone,
        meetingTime,
        checkinTime,
        status: SafetyCheckinStatus.SCHEDULED,
        alertSentAt: new Date(),
      },
    });

    await this.notificationsService.sendSafetyAlert(dto.safetyContactPhone, profile.displayName, meetingTime);
    return checkin;
  }

  listMine(userId: string) {
    return this.prisma.safetyCheckin.findMany({ where: { userId }, orderBy: { meetingTime: 'desc' } });
  }

  async confirmSafe(userId: string, checkinId: string) {
    const checkin = await this.getOwnedCheckin(userId, checkinId);
    if (checkin.status !== SafetyCheckinStatus.SCHEDULED) {
      throw new BadRequestException('This check-in is no longer active');
    }
    return this.prisma.safetyCheckin.update({
      where: { id: checkinId },
      data: { status: SafetyCheckinStatus.CONFIRMED_SAFE },
    });
  }

  async cancel(userId: string, checkinId: string) {
    const checkin = await this.getOwnedCheckin(userId, checkinId);
    if (checkin.status !== SafetyCheckinStatus.SCHEDULED) {
      throw new BadRequestException('This check-in is no longer active');
    }
    return this.prisma.safetyCheckin.update({
      where: { id: checkinId },
      data: { status: SafetyCheckinStatus.CANCELLED },
    });
  }

  private async getOwnedCheckin(userId: string, checkinId: string) {
    const checkin = await this.prisma.safetyCheckin.findUnique({ where: { id: checkinId } });
    if (!checkin) {
      throw new NotFoundException('Check-in not found');
    }
    if (checkin.userId !== userId) {
      throw new ForbiddenException();
    }
    return checkin;
  }

  /** Sweeps for scheduled check-ins whose time has passed with no confirmation and alerts the safety contact. */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async sweepMissedCheckins() {
    const overdue = await this.prisma.safetyCheckin.findMany({
      where: { status: SafetyCheckinStatus.SCHEDULED, checkinTime: { lt: new Date() } },
      include: { user: { include: { profile: true } } },
    });

    for (const checkin of overdue) {
      await this.prisma.safetyCheckin.update({
        where: { id: checkin.id },
        data: { status: SafetyCheckinStatus.MISSED },
      });
      const displayName = checkin.user.profile?.displayName ?? 'Your contact';
      await this.notificationsService.sendMissedCheckinAlert(checkin.safetyContactPhone, displayName);
      this.logger.warn(`Safety check-in ${checkin.id} missed; alerted ${checkin.safetyContactPhone}`);
    }
  }
}
