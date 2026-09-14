import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/types/authenticated-request';
import { QuestionnaireService } from './questionnaire.service';
import { SubmitQuestionnaireDto } from './dto/submit-questionnaire.dto';
import { UpdateHobbiesDto } from './dto/update-hobbies.dto';
import { UpdateCoreValuesDto } from './dto/update-core-values.dto';
import { UpdateRelationshipIntentDto } from './dto/update-relationship-intent.dto';

@Controller('questionnaire')
@UseGuards(JwtAuthGuard)
export class QuestionnaireController {
  constructor(private readonly questionnaireService: QuestionnaireService) {}

  @Get('me')
  getMyResponses(@CurrentUser() user: RequestUser) {
    return this.questionnaireService.getMyResponses(user.id);
  }

  @Post('submit')
  submit(@CurrentUser() user: RequestUser, @Body() dto: SubmitQuestionnaireDto) {
    return this.questionnaireService.submit(user.id, dto);
  }

  @Post('hobbies')
  updateHobbies(@CurrentUser() user: RequestUser, @Body() dto: UpdateHobbiesDto) {
    return this.questionnaireService.updateHobbies(user.id, dto.hobbies);
  }

  @Post('core-values')
  updateCoreValues(@CurrentUser() user: RequestUser, @Body() dto: UpdateCoreValuesDto) {
    return this.questionnaireService.updateCoreValues(user.id, dto.coreValues);
  }

  @Post('relationship-intent')
  updateRelationshipIntent(@CurrentUser() user: RequestUser, @Body() dto: UpdateRelationshipIntentDto) {
    return this.questionnaireService.updateRelationshipIntent(user.id, dto.relationshipIntent);
  }
}
