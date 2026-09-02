import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { IsUUID } from 'class-validator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/types/authenticated-request';
import { BlocksService } from './blocks.service';

class BlockUserDto {
  @IsUUID()
  userId!: string;
}

@Controller('blocks')
@UseGuards(JwtAuthGuard)
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Get()
  listMine(@CurrentUser() user: RequestUser) {
    return this.blocksService.listMine(user.id);
  }

  @Post()
  block(@CurrentUser() user: RequestUser, @Body() dto: BlockUserDto) {
    return this.blocksService.block(user.id, dto.userId);
  }

  @Delete()
  unblock(@CurrentUser() user: RequestUser, @Body() dto: BlockUserDto) {
    return this.blocksService.unblock(user.id, dto.userId);
  }
}
