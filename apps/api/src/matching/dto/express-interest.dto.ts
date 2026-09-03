import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class ExpressInterestDto {
  @IsBoolean()
  interested!: boolean;

  /** Premium-only. Ignored (never persisted) for a Pass or a Free-plan user. */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}
