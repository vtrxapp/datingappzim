import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedRequest } from '../types/authenticated-request';
import { AccessTokenPayload } from '../../auth/types';

const PRESENCE_TOUCH_INTERVAL_MS = 60_000;

@Injectable()
export class JwtAuthGuard implements CanActivate {
  // Per-user debounce so the 5s chat poll doesn't turn into a DB write on
  // every single request; a singleton provider, so this survives across requests.
  private readonly lastTouched = new Map<string, number>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }

    try {
      const payload = this.jwtService.verify<AccessTokenPayload>(token, {
        secret: this.configService.get('jwt.accessSecret'),
      });
      request.user = { id: payload.sub, role: payload.role };
      this.touchLastActive(payload.sub);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  /** Fire-and-forget presence tracking; must never slow down or fail the request it rides on. */
  private touchLastActive(userId: string): void {
    const now = Date.now();
    if (now - (this.lastTouched.get(userId) ?? 0) < PRESENCE_TOUCH_INTERVAL_MS) {
      return;
    }
    this.lastTouched.set(userId, now);
    this.prisma.user.update({ where: { id: userId }, data: { lastActiveAt: new Date() } }).catch(() => {});
  }

  private extractToken(request: AuthenticatedRequest): string | null {
    if (request.cookies?.access_token) {
      return request.cookies.access_token;
    }
    const header = request.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      return header.slice('Bearer '.length);
    }
    return null;
  }
}
