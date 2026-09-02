/**
 * Weights for the rule-based (non-ML) matching scorer in
 * apps/api/src/matching/matching.service.ts. Tunable without touching the
 * scoring logic itself.
 */
export const MATCHING_CONFIG = {
  /** Points added when both users are based in the same city. */
  sameCityScore: 40,
  /** Points added when users are in different cities but candidate is still eligible. */
  differentCityScore: 5,
  /** Max points for age proximity, decayed linearly to 0 at maxAgeGapForScore. */
  maxAgeProximityScore: 30,
  maxAgeGapForScore: 20,
  /** Points per shared core value (questionnaire CORE_VALUES overlap). */
  pointsPerSharedCoreValue: 10,
  /** Points added if the candidate is ID-verified. */
  verifiedBonus: 10,
};
