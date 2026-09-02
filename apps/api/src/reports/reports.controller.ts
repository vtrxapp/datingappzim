import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/types/authenticated-request';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('mine')
  listMine(@CurrentUser() user: RequestUser) {
    return this.reportsService.listMine(user.id);
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateReportDto) {
    return this.reportsService.create(user.id, dto);
  }
}
