import { MATCHING_CONFIG } from 'shared';
import { City, VerificationStatus } from 'shared';

export interface ScoringInput {
  myCity: City;
  myAge: number;
  myCoreValues: string[];
  myHobbies: string[];
  candidateCity: City;
  candidateAge: number;
  candidateCoreValues: string[];
  candidateHobbies: string[];
  candidateVerificationStatus: VerificationStatus;
}

/** Pure rule-based scorer — no ML. Higher is better. */
export function scoreCandidate(input: ScoringInput): number {
  let score = 0;

  score += input.myCity === input.candidateCity ? MATCHING_CONFIG.sameCityScore : MATCHING_CONFIG.differentCityScore;

  const ageGap = Math.abs(input.myAge - input.candidateAge);
  const ageProximity = Math.max(0, 1 - ageGap / MATCHING_CONFIG.maxAgeGapForScore);
  score += ageProximity * MATCHING_CONFIG.maxAgeProximityScore;

  const sharedValues = input.myCoreValues.filter((v) => input.candidateCoreValues.includes(v));
  score += sharedValues.length * MATCHING_CONFIG.pointsPerSharedCoreValue;

  // Hobbies are free text (custom entries allowed), so compare case/whitespace-insensitively —
  // "Hiking" and "hiking " should still count as the same answer.
  const normalize = (s: string) => s.trim().toLowerCase();
  const candidateHobbiesNormalized = input.candidateHobbies.map(normalize);
  const sharedHobbies = input.myHobbies.filter((h) => candidateHobbiesNormalized.includes(normalize(h)));
  score += sharedHobbies.length * MATCHING_CONFIG.pointsPerSharedHobby;

  if (input.candidateVerificationStatus === VerificationStatus.VERIFIED) {
    score += MATCHING_CONFIG.verifiedBonus;
  }

  return Math.round(score * 100) / 100;
}

/** Canonical, order-independent pair so a Match row is unique per pair regardless of who was scored as "me". */
export function canonicalPair(userIdA: string, userIdB: string): [string, string] {
  return userIdA < userIdB ? [userIdA, userIdB] : [userIdB, userIdA];
}
