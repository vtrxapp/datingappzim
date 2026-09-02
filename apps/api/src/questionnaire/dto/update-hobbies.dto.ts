import { ArrayMaxSize, IsArray, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateHobbiesDto {
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(40, { each: true })
  hobbies!: string[];
}
