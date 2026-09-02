import { IsBoolean } from 'class-validator';

export class ExpressInterestDto {
  @IsBoolean()
  interested!: boolean;
}
