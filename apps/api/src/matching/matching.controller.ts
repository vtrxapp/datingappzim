import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/types/authenticated-request';
import { MatchingService } from './matching.service';
import { ExpressInterestDto } from './dto/express-interest.dto';

@Controller('matching')
@UseGuards(JwtAuthGuard)
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get('daily-batch')
  getDailyBatch(@CurrentUser() user: RequestUser) {
    return this.matchingService.getDailyBatch(user.id);
  }

  @Get('mutual')
  listMutual(@CurrentUser() user: RequestUser) {
    return this.matchingService.listMyMutualMatches(user.id);
  }

  @Get('admirers')
  listAdmirers(@CurrentUser() user: RequestUser) {
    return this.matchingService.listAdmirers(user.id);
  }

  @Get(':matchId')
  getMatch(@CurrentUser() user: RequestUser, @Param('matchId') matchId: string) {
    return this.matchingService.getMatch(user.id, matchId);
  }

  @Post(':matchId/interest')
  expressInterest(
    @CurrentUser() user: RequestUser,
    @Param('matchId') matchId: string,
    @Body() dto: ExpressInterestDto,
  ) {
    return this.matchingService.expressInterest(user.id, matchId, dto.interested);
  }
}
