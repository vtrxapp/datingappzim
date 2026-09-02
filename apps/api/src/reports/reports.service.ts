import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  create(reporterId: string, dto: CreateReportDto) {
    if (dto.reportedUserId === reporterId) {
      throw new BadRequestException('You cannot report yourself');
    }
    return this.prisma.report.create({
      data: {
        reporterId,
        reportedUserId: dto.reportedUserId,
        matchId: dto.matchId,
        reason: dto.reason,
        details: dto.details,
      },
    });
  }

  listMine(reporterId: string) {
    return this.prisma.report.findMany({ where: { reporterId }, orderBy: { createdAt: 'desc' } });
  }
}
