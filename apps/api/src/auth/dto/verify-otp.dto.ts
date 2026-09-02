import { Matches } from 'class-validator';

const E164_REGEX = /^\+[1-9]\d{7,14}$/;

export class VerifyOtpDto {
  @Matches(E164_REGEX, { message: 'phone must be in E.164 format, e.g. +263771234567' })
  phone!: string;

  @Matches(/^\d{4,8}$/, { message: 'code must be numeric' })
  code!: string;
}
