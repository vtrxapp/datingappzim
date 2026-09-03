/**
 * Single source of truth for the profile questionnaire. The backend
 * validates submitted answers against it and uses `usedInScoring` fields
 * for rule-based matching; the frontend's onboarding wizard
 * (apps/web/src/app/onboarding/page.tsx) renders every question here
 * EXCEPT HOBBIES — that one is deliberately left out of onboarding (kept
 * to signup-friction-free ~7 questions) and is only ever answered from
 * Settings, alongside a profile photo. Both are required before a user can
 * act on a match (Interested or Pass); see
 * ProfilesService.assertReadyToExpressInterest in the backend.
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
  /** MULTI_SELECT only: besides picking from `options`, the user can also type
   * their own free-text entries (e.g. HOBBIES) — validation only checks
   * shape/length, not membership in `options`, which become suggestions. */
  allowCustomValues?: boolean;
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

export const HOBBY_OPTIONS: QuestionOption[] = [
  { value: 'FOOTBALL', label: 'Football' },
  { value: 'NETBALL', label: 'Netball' },
  { value: 'HIKING', label: 'Hiking' },
  { value: 'RUNNING', label: 'Running' },
  { value: 'GYM_FITNESS', label: 'Gym & fitness' },
  { value: 'MUSIC_CHOIR', label: 'Music / choir' },
  { value: 'BRAAI_COOKING', label: 'Braais & cooking' },
  { value: 'GARDENING', label: 'Gardening' },
  { value: 'READING', label: 'Reading' },
  { value: 'TRAVELING', label: 'Traveling' },
  { value: 'DANCING', label: 'Dancing' },
  { value: 'GAMING', label: 'Gaming' },
  { value: 'FASHION', label: 'Fashion' },
  { value: 'CARS', label: 'Cars' },
  { value: 'PHOTOGRAPHY', label: 'Photography' },
  { value: 'VOLUNTEERING', label: 'Volunteering / community work' },
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
  {
    key: 'HOBBIES',
    order: 8,
    type: 'MULTI_SELECT',
    prompt: 'What do you enjoy doing?',
    helperText:
      "Type your own — specific is better than generic, it gives people something to open a chat with. " +
      "You can skip this now, but you'll need at least one before you can respond to matches.",
    required: false,
    options: HOBBY_OPTIONS,
    maxSelections: 5,
    allowCustomValues: true,
    usedInScoring: true,
  },
];

export function getQuestionByKey(key: string): QuestionDefinition | undefined {
  return QUESTIONNAIRE.find((q) => q.key === key);
}
