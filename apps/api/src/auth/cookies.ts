import { Response } from 'express';
import { IssuedTokens } from './auth.service';

export function setAuthCookies(res: Response, tokens: IssuedTokens): void {
  const secure = process.env.NODE_ENV === 'production';

  res.cookie('access_token', tokens.accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: tokens.accessTtlSeconds * 1000,
  });
  res.cookie('refresh_token', tokens.refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: tokens.refreshTtlSeconds * 1000,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/' });
}
