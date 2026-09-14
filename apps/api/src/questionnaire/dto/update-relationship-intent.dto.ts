import { IsString } from 'class-validator';

export class UpdateRelationshipIntentDto {
  @IsString()
  relationshipIntent!: string;
}
