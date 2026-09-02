import { IsObject, IsString, MaxLength, MinLength } from 'class-validator';

export class SubmitQuestionnaireDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  displayName!: string;

  /**
   * Keyed by QuestionDefinition.key from packages/shared/src/questionnaire.ts,
   * e.g. { GENDER: 'MALE', SEEKING_AGE_RANGE: { min: 28, max: 40 }, ... }.
   * Validated dynamically against that config in QuestionnaireService rather
   * than with per-field decorators, since the question set is config-driven.
   */
  @IsObject()
  answers!: Record<string, unknown>;
}
