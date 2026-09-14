import { IsEnum } from 'class-validator';
import { City } from 'shared';

export class UpdateCityDto {
  @IsEnum(City)
  city!: City;
}
