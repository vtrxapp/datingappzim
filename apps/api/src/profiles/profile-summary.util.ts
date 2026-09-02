import { Profile, ProfilePhoto, QuestionnaireResponse } from '@prisma/client';
import { ProfileSummaryDto } from 'shared';
import { QUESTIONNAIRE } from 'shared';

export function computeAge(dateOfBirth: Date): number {
  const now = new Date();
  let age = now.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = now.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dateOfBirth.getDate())) {
    age -= 1;
  }
  return age;
}

const ABOUT_KEYS = ['RELATIONSHIP_INTENT', 'CORE_VALUES', 'HOBBIES'];

export function toProfileSummaryDto(
  userId: string,
  profile: Profile & { photos: ProfilePhoto[] },
  responses: QuestionnaireResponse[],
): ProfileSummaryDto {
  const aboutAnswers = responses
    .filter((r) => ABOUT_KEYS.includes(r.questionKey))
    .map((r) => {
      const question = QUESTIONNAIRE.find((q) => q.key === r.questionKey);
      const rawValue = r.answerValue as unknown;
      const values = Array.isArray(rawValue) ? rawValue : [rawValue];
      const labels = values
        .map((v) => question?.options?.find((o) => o.value === v)?.label ?? String(v))
        .join(', ');
      return { key: r.questionKey, label: question?.prompt ?? r.questionKey, value: labels };
    });

  return {
    userId,
    displayName: profile.displayName,
    age: computeAge(profile.dateOfBirth),
    city: profile.city,
    bio: profile.bio,
    photos: profile.photos.sort((a, b) => a.position - b.position).map((p) => p.url),
    verificationStatus: profile.verificationStatus,
    aboutAnswers,
  };
}
