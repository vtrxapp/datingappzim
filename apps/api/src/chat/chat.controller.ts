import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/types/authenticated-request';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':matchId/messages')
  listMessages(@CurrentUser() user: RequestUser, @Param('matchId') matchId: string) {
    return this.chatService.listMessages(user.id, matchId);
  }

  @Post(':matchId/messages')
  sendText(@CurrentUser() user: RequestUser, @Param('matchId') matchId: string, @Body() dto: SendMessageDto) {
    return this.chatService.sendTextMessage(user.id, matchId, dto.content);
  }

  @Post(':matchId/messages/image')
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: MAX_UPLOAD_BYTES } }))
  sendImage(
    @CurrentUser() user: RequestUser,
    @Param('matchId') matchId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('image file is required');
    }
    return this.chatService.sendImageMessage(user.id, matchId, file.buffer);
  }
}
