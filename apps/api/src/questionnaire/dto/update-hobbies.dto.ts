import { IsArray, IsString } from 'class-validator';

export class UpdateHobbiesDto {
  @IsArray()
  @IsString({ each: true })
  hobbies!: string[];
}
