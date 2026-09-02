import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ReportReason } from 'shared';

export class CreateReportDto {
  @IsUUID()
  reportedUserId!: string;

  @IsOptional()
  @IsUUID()
  matchId?: string;

  @IsEnum(ReportReason)
  reason!: ReportReason;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  details?: string;
}
