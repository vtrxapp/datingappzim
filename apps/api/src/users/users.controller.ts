import { Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/types/authenticated-request';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('me/deactivate')
  @HttpCode(200)
  async deactivate(@CurrentUser() user: RequestUser) {
    await this.usersService.deactivate(user.id);
    return { ok: true };
  }
}
