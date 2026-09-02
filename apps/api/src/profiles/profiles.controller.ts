import {
  BadRequestException,
  Body,
  Controller,
  Delete,
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
import { ProfilesService } from './profiles.service';
import { UpdateBioDto } from './dto/update-bio.dto';

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // pre-compression ceiling; ImageCompressionService brings it down further

@Controller('profiles')
@UseGuards(JwtAuthGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  getMyProfile(@CurrentUser() user: RequestUser) {
    return this.profilesService.findByUserId(user.id);
  }

  @Get(':userId')
  getProfile(@Param('userId') userId: string) {
    return this.profilesService.getProfileSummaryForViewer(userId);
  }

  @Post('me/bio')
  updateBio(@CurrentUser() user: RequestUser, @Body() dto: UpdateBioDto) {
    return this.profilesService.updateBio(user.id, dto.bio);
  }

  @Post('me/photos')
  @UseInterceptors(FileInterceptor('photo', { limits: { fileSize: MAX_UPLOAD_BYTES } }))
  addPhoto(@CurrentUser() user: RequestUser, @UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('photo file is required');
    }
    return this.profilesService.addPhoto(user.id, file.buffer);
  }

  @Delete('me/photos/:photoId')
  removePhoto(@CurrentUser() user: RequestUser, @Param('photoId') photoId: string) {
    return this.profilesService.removePhoto(user.id, photoId);
  }

  @Post('me/verification')
  @UseInterceptors(FileInterceptor('document', { limits: { fileSize: MAX_UPLOAD_BYTES } }))
  submitVerification(@CurrentUser() user: RequestUser, @UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('document file is required');
    }
    return this.profilesService.submitVerificationDocument(user.id, file.buffer, file.mimetype);
  }
}
