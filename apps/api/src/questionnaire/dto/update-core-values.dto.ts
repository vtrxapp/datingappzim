import { ArrayMaxSize, IsArray, IsString } from 'class-validator';

export class UpdateCoreValuesDto {
  @IsArray()
  @ArrayMaxSize(3)
  @IsString({ each: true })
  coreValues!: string[];
}
