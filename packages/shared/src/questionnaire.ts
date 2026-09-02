/**
 * Single source of truth for the onboarding questionnaire. The frontend
 * renders this config to build the wizard; the backend validates submitted
 * answers against it and uses `usedInScoring` fields for rule-based matching.
 *
 * Kept to 7 questions so the flow is completable well under 90 seconds.
 */
export type QuestionType = 'SINGLE_SELECT' | 'MULTI_SELECT' | 'RANGE' | 'TEXT';

export interface QuestionOption {
  value: string;
  label: string;
}

export interface QuestionDefinition {
  key: string;
  order: number;
  type: QuestionType;
  prompt: string;
  helperText?: string;
  required: boolean;
  options?: QuestionOption[];
  /** For RANGE questions (e.g. age range seeking). */
  min?: number;
  max?: number;
  /** Max selectable options for MULTI_SELECT (deal-breakers/values). */
  maxSelections?: number;
  /** Whether the matching engine reads this answer when scoring candidates. */
  usedInScoring: boolean;
}

export const CORE_VALUE_OPTIONS: QuestionOption[] = [
  { value: 'FAITH_CENTERED', label: 'Faith-centered life' },
  { value: 'FAMILY_ORIENTED', label: 'Family-oriented' },
  { value: 'CAREER_DRIVEN', label: 'Career-driven' },
  { value: 'FINANCIALLY_DISCIPLINED', label: 'Financially disciplined' },
  { value: 'WANTS_CHILDREN', label: 'Wants children' },
  { value: 'DOES_NOT_WANT_CHILDREN', label: "Doesn't want children" },
  { value: 'NON_SMOKER', label: 'Non-smoker' },
  { value: 'NON_DRINKER', label: 'Non-drinker' },
  { value: 'RURAL_ROOTS', label: 'Values rural/home area roots' },
  { value: 'URBAN_LIFESTYLE', label: 'Prefers urban lifestyle' },
];

export const QUESTIONNAIRE: QuestionDefinition[] = [
  {
    key: 'GENDER',
    order: 1,
    type: 'SINGLE_SELECT',
    prompt: 'I am a...',
    required: true,
    options: [
      { value: 'MALE', label: 'Man' },
      { value: 'FEMALE', label: 'Woman' },
    ],
    usedInScoring: true,
  },
  {
    key: 'SEEKING_GENDER',
    order: 2,
    type: 'SINGLE_SELECT',
    prompt: 'Seeking a...',
    required: true,
    options: [
      { value: 'MALE', label: 'Man' },
      { value: 'FEMALE', label: 'Woman' },
    ],
    usedInScoring: true,
  },
  {
    key: 'CITY',
    order: 3,
    type: 'SINGLE_SELECT',
    prompt: 'Where are you based?',
    required: true,
    options: [
      { value: 'HARARE', label: 'Harare' },
      { value: 'BULAWAYO', label: 'Bulawayo' },
      { value: 'OTHER', label: 'Elsewhere in Zimbabwe' },
    ],
    usedInScoring: true,
  },
  {
    key: 'RELATIONSHIP_INTENT',
    order: 4,
    type: 'SINGLE_SELECT',
    prompt: "What are you looking for?",
    helperText: 'This app is focused on marriage-track relationships only.',
    required: true,
    options: [{ value: 'MARRIAGE', label: "Marriage — I'm ready to settle down" }],
    usedInScoring: false,
  },
  {
    key: 'SEEKING_AGE_RANGE',
    order: 5,
    type: 'RANGE',
    prompt: "What age range are you open to?",
    required: true,
    min: 18,
    max: 75,
    usedInScoring: true,
  },
  {
    key: 'DATE_OF_BIRTH',
    order: 6,
    type: 'TEXT',
    prompt: 'Your date of birth',
    helperText: 'Used to calculate your age. Never shown publicly.',
    required: true,
    usedInScoring: true,
  },
  {
    key: 'CORE_VALUES',
    order: 7,
    type: 'MULTI_SELECT',
    prompt: 'Pick up to 3 things that matter most to you',
    required: true,
    options: CORE_VALUE_OPTIONS,
    maxSelections: 3,
    usedInScoring: true,
  },
];

export function getQuestionByKey(key: string): QuestionDefinition | undefined {
  return QUESTIONNAIRE.find((q) => q.key === key);
}
