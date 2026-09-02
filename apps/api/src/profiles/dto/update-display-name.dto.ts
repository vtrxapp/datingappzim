import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateDisplayNameDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  displayName!: string;
}
