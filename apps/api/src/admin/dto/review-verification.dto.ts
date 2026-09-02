import { IsBoolean } from 'class-validator';

export class ReviewVerificationDto {
  @IsBoolean()
  approve!: boolean;
}
