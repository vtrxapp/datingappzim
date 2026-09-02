import { BadRequestException, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';

interface OtpRecord {
  codeHash: string;
  attempts: number;
}

class TooManyRequests extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.TOO_MANY_REQUESTS);
  }
}

@Injectable()
export class OtpService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly configService: ConfigService,
  ) {}

  private codeKey(phone: string) {
    return `otp:code:${phone}`;
  }

  private cooldownKey(phone: string) {
    return `otp:cooldown:${phone}`;
  }

  private hash(code: string): string {
    const secret = this.configService.get<string>('otp.hashSecret')!;
    return createHmac('sha256', secret).update(code).digest('hex');
  }

  /** Generates a fresh OTP, stores its hash in Redis, and returns the plaintext code to send. */
  async generate(phone: string): Promise<string> {
    const stillInCooldown = await this.redis.exists(this.cooldownKey(phone));
    if (stillInCooldown) {
      throw new TooManyRequests('Please wait before requesting another code');
    }

    const length = this.configService.get<number>('otp.length')!;
    const ttlSeconds = this.configService.get<number>('otp.ttlSeconds')!;
    const cooldownSeconds = this.configService.get<number>('otp.resendCooldownSeconds')!;

    const max = 10 ** length;
    const code = randomInt(0, max).toString().padStart(length, '0');
    const record: OtpRecord = { codeHash: this.hash(code), attempts: 0 };

    await this.redis.set(this.codeKey(phone), JSON.stringify(record), 'EX', ttlSeconds);
    await this.redis.set(this.cooldownKey(phone), '1', 'EX', cooldownSeconds);

    return code;
  }

  async verify(phone: string, submittedCode: string): Promise<boolean> {
    const raw = await this.redis.get(this.codeKey(phone));
    if (!raw) {
      throw new BadRequestException('Code expired or not requested. Please request a new one.');
    }

    const record: OtpRecord = JSON.parse(raw);
    const maxAttempts = this.configService.get<number>('otp.maxAttempts')!;

    if (record.attempts >= maxAttempts) {
      await this.redis.del(this.codeKey(phone));
      throw new BadRequestException('Too many incorrect attempts. Please request a new code.');
    }

    const submittedHash = this.hash(submittedCode);
    const matches =
      submittedHash.length === record.codeHash.length &&
      timingSafeEqual(Buffer.from(submittedHash), Buffer.from(record.codeHash));

    if (!matches) {
      record.attempts += 1;
      const ttl = await this.redis.ttl(this.codeKey(phone));
      await this.redis.set(this.codeKey(phone), JSON.stringify(record), 'EX', Math.max(ttl, 1));
      throw new BadRequestException('Incorrect code');
    }

    await this.redis.del(this.codeKey(phone));
    return true;
  }
}
