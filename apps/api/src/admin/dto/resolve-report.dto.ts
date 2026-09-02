import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReportStatus } from 'shared';

export class ResolveReportDto {
  @IsEnum(ReportStatus)
  status!: typeof ReportStatus.REVIEWED | typeof ReportStatus.ACTIONED | typeof ReportStatus.DISMISSED;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  actionNotes?: string;
}
