import { IsISO8601, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const E164_REGEX = /^\+[1-9]\d{7,14}$/;

export class CreateCheckinDto {
  @IsOptional()
  @IsString()
  matchId?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  safetyContactName!: string;

  @Matches(E164_REGEX, { message: 'safetyContactPhone must be in E.164 format, e.g. +263771234567' })
  safetyContactPhone!: string;

  @IsISO8601()
  meetingTime!: string;

  @IsISO8601()
  checkinTime!: string;
}
