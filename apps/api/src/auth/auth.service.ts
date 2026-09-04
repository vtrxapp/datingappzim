import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import type Redis from 'ioredis';
import { UserRole } from 'shared';
import { REDIS_CLIENT } from '../redis/redis.module';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OtpService } from './otp.service';
import { AccessTokenPayload, RefreshTokenPayload } from './types';

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  accessTtlSeconds: number;
  refreshTtlSeconds: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly otpService: OtpService,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async requestOtp(phone: string): Promise<void> {
    const code = await this.otpService.generate(phone);
    await this.notificationsService.sendOtpCode(phone, code);
  }

  async verifyOtp(phone: string, code: string) {
    await this.otpService.verify(phone, code);

    const { user, isNewUser } = await this.usersService.findOrCreateByPhone(phone);
    if (!isNewUser) {
      await this.usersService.markPhoneVerified(user.id);
    }

    const tokens = await this.issueTokens(user.id, user.role);
    return { user, isNewUser, tokens };
  }

  async issueTokens(userId: string, role: UserRole): Promise<IssuedTokens> {
    const accessTtlSeconds = this.configService.get<number>('jwt.accessTtlSeconds')!;
    const refreshTtlSeconds = this.configService.get<number>('jwt.refreshTtlSeconds')!;

    const accessPayload: AccessTokenPayload = { sub: userId, role };
    const accessToken = this.jwtService.sign(accessPayload, {
      secret: this.configService.get('jwt.accessSecret'),
      expiresIn: accessTtlSeconds,
    });

    const jti = randomUUID();
    const refreshPayload: RefreshTokenPayload = { sub: userId, jti };
    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.get('jwt.refreshSecret'),
      expiresIn: refreshTtlSeconds,
    });

    await this.redis.set(`refresh:jti:${jti}`, userId, 'EX', refreshTtlSeconds);

    return { accessToken, refreshToken, accessTtlSeconds, refreshTtlSeconds };
  }

  async refresh(refreshToken: string): Promise<IssuedTokens> {
    let payload: RefreshTokenPayload;
    try {
      payload = this.jwtService.verify<RefreshTokenPayload>(refreshToken, {
        secret: this.configService.get('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const storedUserId = await this.redis.get(`refresh:jti:${payload.jti}`);
    if (!storedUserId || storedUserId !== payload.sub) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    // Rotate: the old refresh token can never be replayed again.
    await this.redis.del(`refresh:jti:${payload.jti}`);
    return this.issueTokens(user.id, user.role);
  }

  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) return;
    try {
      const payload = this.jwtService.verify<RefreshTokenPayload>(refreshToken, {
        secret: this.configService.get('jwt.refreshSecret'),
      });
      await this.redis.del(`refresh:jti:${payload.jti}`);
    } catch {
      // Already invalid/expired, nothing to revoke.
    }
  }
}
