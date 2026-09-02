import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ReportStatus } from 'shared';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/types/authenticated-request';
import { AdminService } from './admin.service';
import { ResolveReportDto } from './dto/resolve-report.dto';
import { ReviewVerificationDto } from './dto/review-verification.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('reports')
  listReports(@Query('status') status?: ReportStatus) {
    return this.adminService.listReports(status);
  }

  @Post('reports/:id/resolve')
  resolveReport(@CurrentUser() admin: RequestUser, @Param('id') id: string, @Body() dto: ResolveReportDto) {
    return this.adminService.resolveReport(admin.id, id, dto.status);
  }

  @Get('verifications')
  listPendingVerifications() {
    return this.adminService.listPendingVerifications();
  }

  @Post('verifications/:profileId/review')
  reviewVerification(@Param('profileId') profileId: string, @Body() dto: ReviewVerificationDto) {
    return this.adminService.reviewVerification(profileId, dto.approve);
  }
}
