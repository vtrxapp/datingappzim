import { BadRequestException, Injectable } from '@nestjs/common';
import { City, Gender, QUESTIONNAIRE, QuestionDefinition, SubscriptionPlanId, SubscriptionStatus } from 'shared';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { ProfilesService } from '../profiles/profiles.service';
import { computeAge } from '../profiles/profile-summary.util';
import { SubmitQuestionnaireDto } from './dto/submit-questionnaire.dto';

const MIN_AGE = 18;

@Injectable()
export class QuestionnaireService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly profilesService: ProfilesService,
  ) {}

  getMyResponses(userId: string) {
    return this.prisma.questionnaireResponse.findMany({ where: { userId } });
  }

  async submit(userId: string, dto: SubmitQuestionnaireDto) {
    for (const question of QUESTIONNAIRE) {
      this.validateAnswer(question, dto.answers[question.key]);
    }

    const dateOfBirth = new Date(dto.answers.DATE_OF_BIRTH as string);
    if (computeAge(dateOfBirth) < MIN_AGE) {
      throw new BadRequestException(`You must be at least ${MIN_AGE} to use this app`);
    }

    const ageRange = dto.answers.SEEKING_AGE_RANGE as { min: number; max: number };

    await this.prisma.$transaction(
      QUESTIONNAIRE.map((question) =>
        this.prisma.questionnaireResponse.upsert({
          where: { userId_questionKey: { userId, questionKey: question.key } },
          update: { answerValue: dto.answers[question.key] as object },
          create: { userId, questionKey: question.key, answerValue: dto.answers[question.key] as object },
        }),
      ),
    );

    await this.profilesService.createFromOnboarding(userId, {
      displayName: dto.displayName,
      dateOfBirth,
      gender: dto.answers.GENDER as Gender,
      seekingGender: dto.answers.SEEKING_GENDER as Gender,
      city: dto.answers.CITY as City,
      seekingAgeMin: ageRange.min,
      seekingAgeMax: ageRange.max,
    });

    await this.usersService.markOnboardingComplete(userId);

    const hasSubscription = await this.prisma.subscription.findFirst({ where: { userId } });
    if (!hasSubscription) {
      await this.prisma.subscription.create({
        data: { userId, plan: SubscriptionPlanId.FREE, status: SubscriptionStatus.ACTIVE },
      });
    }

    return { ok: true };
  }

  private validateAnswer(question: QuestionDefinition, value: unknown): void {
    if (value === undefined || value === null || value === '') {
      if (question.required) {
        throw new BadRequestException(`Missing answer for ${question.key}`);
      }
      return;
    }

    switch (question.type) {
      case 'SINGLE_SELECT': {
        const allowed = question.options?.map((o) => o.value) ?? [];
        if (!allowed.includes(value as string)) {
          throw new BadRequestException(`Invalid value for ${question.key}`);
        }
        break;
      }
      case 'MULTI_SELECT': {
        const allowed = question.options?.map((o) => o.value) ?? [];
        if (!Array.isArray(value) || value.some((v) => !allowed.includes(v))) {
          throw new BadRequestException(`Invalid selection for ${question.key}`);
        }
        if (question.maxSelections && value.length > question.maxSelections) {
          throw new BadRequestException(`Select at most ${question.maxSelections} for ${question.key}`);
        }
        break;
      }
      case 'RANGE': {
        const range = value as { min?: number; max?: number };
        if (
          typeof range?.min !== 'number' ||
          typeof range?.max !== 'number' ||
          range.min > range.max ||
          (question.min !== undefined && range.min < question.min) ||
          (question.max !== undefined && range.max > question.max)
        ) {
          throw new BadRequestException(`Invalid range for ${question.key}`);
        }
        break;
      }
      case 'TEXT': {
        if (question.key === 'DATE_OF_BIRTH' && Number.isNaN(new Date(value as string).getTime())) {
          throw new BadRequestException('Invalid date of birth');
        }
        break;
      }
    }
  }
}
