import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/types/authenticated-request';
import { QuestionnaireService } from './questionnaire.service';
import { SubmitQuestionnaireDto } from './dto/submit-questionnaire.dto';

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
}
