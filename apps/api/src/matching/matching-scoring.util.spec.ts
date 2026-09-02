import { City, VerificationStatus } from 'shared';
import { canonicalPair, scoreCandidate } from './matching-scoring.util';

describe('scoreCandidate', () => {
  const base = {
    myCity: City.HARARE,
    myAge: 30,
    myCoreValues: ['FAITH_CENTERED', 'FAMILY_ORIENTED'],
    myHobbies: ['HIKING', 'READING'],
    candidateCity: City.HARARE,
    candidateAge: 30,
    candidateCoreValues: ['FAITH_CENTERED', 'FAMILY_ORIENTED'],
    candidateHobbies: ['HIKING', 'READING'],
    candidateVerificationStatus: VerificationStatus.UNVERIFIED,
  };

  it('scores a same-city, same-age, fully-shared-values candidate highly', () => {
    const score = scoreCandidate(base);
    expect(score).toBeGreaterThan(80);
  });

  it('scores lower for a different city', () => {
    const sameCity = scoreCandidate(base);
    const diffCity = scoreCandidate({ ...base, candidateCity: City.BULAWAYO });
    expect(diffCity).toBeLessThan(sameCity);
  });

  it('scores lower as the age gap grows', () => {
    const close = scoreCandidate(base);
    const far = scoreCandidate({ ...base, candidateAge: 55 });
    expect(far).toBeLessThan(close);
  });

  it('rewards shared core values', () => {
    const noOverlap = scoreCandidate({ ...base, candidateCoreValues: ['CAREER_DRIVEN'] });
    const fullOverlap = scoreCandidate(base);
    expect(fullOverlap).toBeGreaterThan(noOverlap);
  });

  it('rewards shared hobbies, but less than shared core values', () => {
    const noOverlap = scoreCandidate({ ...base, candidateHobbies: ['GAMING'] });
    const fullOverlap = scoreCandidate(base);
    expect(fullOverlap).toBeGreaterThan(noOverlap);

    const oneHobby = scoreCandidate({ ...base, candidateCoreValues: [], candidateHobbies: ['HIKING'] });
    const oneValue = scoreCandidate({ ...base, candidateCoreValues: ['FAITH_CENTERED'], candidateHobbies: [] });
    expect(oneValue).toBeGreaterThan(oneHobby);
  });

  it('rewards verified candidates', () => {
    const unverified = scoreCandidate(base);
    const verified = scoreCandidate({ ...base, candidateVerificationStatus: VerificationStatus.VERIFIED });
    expect(verified).toBeGreaterThan(unverified);
  });
});

describe('canonicalPair', () => {
  it('returns the same order regardless of input order', () => {
    expect(canonicalPair('a', 'b')).toEqual(canonicalPair('b', 'a'));
  });
});
