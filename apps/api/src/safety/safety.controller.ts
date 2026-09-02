import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/types/authenticated-request';
import { SafetyService } from './safety.service';
import { CreateCheckinDto } from './dto/create-checkin.dto';

@Controller('safety/checkins')
@UseGuards(JwtAuthGuard)
export class SafetyController {
  constructor(private readonly safetyService: SafetyService) {}

  @Get()
  listMine(@CurrentUser() user: RequestUser) {
    return this.safetyService.listMine(user.id);
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateCheckinDto) {
    return this.safetyService.createCheckin(user.id, dto);
  }

  @Post(':id/confirm')
  confirm(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.safetyService.confirmSafe(user.id, id);
  }

  @Post(':id/cancel')
  cancel(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.safetyService.cancel(user.id, id);
  }
}
