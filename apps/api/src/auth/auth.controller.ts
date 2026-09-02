import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthTokensIssuedDto } from 'shared';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RequestUser } from '../common/types/authenticated-request';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { clearAuthCookies, setAuthCookies } from './cookies';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('otp/request')
  @HttpCode(200)
  async requestOtp(@Body() dto: RequestOtpDto): Promise<{ ok: true }> {
    await this.authService.requestOtp(dto.phone);
    return { ok: true };
  }

  @Post('otp/verify')
  @HttpCode(200)
  async verifyOtp(@Body() dto: VerifyOtpDto, @Res({ passthrough: true }) res: Response): Promise<AuthTokensIssuedDto> {
    const { user, isNewUser, tokens } = await this.authService.verifyOtp(dto.phone, dto.code);
    setAuthCookies(res, tokens);
    return { userId: user.id, isNewUser, onboardingComplete: user.onboardingComplete };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<{ ok: true }> {
    const tokens = await this.authService.refresh(req.cookies?.refresh_token);
    setAuthCookies(res, tokens);
    return { ok: true };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<{ ok: true }> {
    await this.authService.logout(req.cookies?.refresh_token);
    clearAuthCookies(res);
    return { ok: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() currentUser: RequestUser) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: currentUser.id } });
    return {
      userId: user.id,
      phone: user.phone,
      role: user.role,
      onboardingComplete: user.onboardingComplete,
    };
  }
}
