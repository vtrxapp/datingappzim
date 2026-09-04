import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/types/authenticated-request';
import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMyState(@CurrentUser() user: RequestUser) {
    return this.subscriptionsService.getMyState(user.id);
  }

  @Post('premium/initiate')
  @UseGuards(JwtAuthGuard)
  initiatePremium(@CurrentUser() user: RequestUser) {
    return this.subscriptionsService.initiatePremiumUpgrade(user.id);
  }

  @Get('payments/:id/status')
  @UseGuards(JwtAuthGuard)
  checkPaymentStatus(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.subscriptionsService.checkPaymentStatus(user.id, id);
  }

  /** Paynow's server-to-server callback, not user-authenticated, Paynow posts here directly. */
  @Post('payments/webhook')
  @HttpCode(200)
  async handleWebhook(@Body() payload: Record<string, string>) {
    await this.subscriptionsService.handleWebhook(payload);
    return { ok: true };
  }
}
