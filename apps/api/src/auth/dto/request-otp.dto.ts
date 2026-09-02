import { Matches } from 'class-validator';

/** E.164 format, e.g. +263771234567 */
const E164_REGEX = /^\+[1-9]\d{7,14}$/;

export class RequestOtpDto {
  @Matches(E164_REGEX, { message: 'phone must be in E.164 format, e.g. +263771234567' })
  phone!: string;
}
