import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { MessageDto } from 'shared';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

function toMessageDto(message: {
  id: string;
  matchId: string;
  senderId: string;
  content: string | null;
  imageUrl: string | null;
  createdAt: Date;
  readAt: Date | null;
  replyTo: { id: string; senderId: string; content: string | null; imageUrl: string | null } | null;
}): MessageDto {
  return {
    id: message.id,
    matchId: message.matchId,
    senderId: message.senderId,
    content: message.content,
    imageUrl: message.imageUrl,
    createdAt: message.createdAt.toISOString(),
    readAt: message.readAt?.toISOString() ?? null,
    replyTo: message.replyTo
      ? {
          id: message.replyTo.id,
          senderId: message.replyTo.senderId,
          content: message.replyTo.content,
          imageUrl: message.replyTo.imageUrl,
        }
      : null,
  };
}

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  private async assertCanChat(userId: string, matchId: string) {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match || (match.userOneId !== userId && match.userTwoId !== userId)) {
      throw new NotFoundException('Match not found');
    }
    if (!match.mutualAt) {
      throw new ForbiddenException('Chat unlocks once you are both interested');
    }
    const otherUserId = match.userOneId === userId ? match.userTwoId : match.userOneId;
    const block = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: otherUserId },
          { blockerId: otherUserId, blockedId: userId },
        ],
      },
    });
    if (block) {
      throw new ForbiddenException('You cannot message this user');
    }
    return match;
  }

  async listMessages(userId: string, matchId: string): Promise<MessageDto[]> {
    await this.assertCanChat(userId, matchId);
    const messages = await this.prisma.message.findMany({
      where: { matchId },
      orderBy: { createdAt: 'asc' },
      include: { replyTo: true },
    });

    await this.prisma.message.updateMany({
      where: { matchId, senderId: { not: userId }, readAt: null },
      data: { readAt: new Date() },
    });

    return messages.map(toMessageDto);
  }

  async sendTextMessage(userId: string, matchId: string, content: string, replyToId?: string): Promise<MessageDto> {
    await this.assertCanChat(userId, matchId);
    if (replyToId) await this.assertReplyTargetInMatch(matchId, replyToId);
    const message = await this.prisma.message.create({
      data: { matchId, senderId: userId, content, replyToId },
      include: { replyTo: true },
    });
    return toMessageDto(message);
  }

  async sendImageMessage(userId: string, matchId: string, fileBuffer: Buffer, replyToId?: string): Promise<MessageDto> {
    await this.assertCanChat(userId, matchId);
    if (!fileBuffer?.length) {
      throw new BadRequestException('image file is required');
    }
    if (replyToId) await this.assertReplyTargetInMatch(matchId, replyToId);
    const { url } = await this.storageService.uploadCompressedImage(`chat/${matchId}`, fileBuffer);
    const message = await this.prisma.message.create({
      data: { matchId, senderId: userId, imageUrl: url, replyToId },
      include: { replyTo: true },
    });
    return toMessageDto(message);
  }

  /** Prevents referencing a message from a different match as a reply target. */
  private async assertReplyTargetInMatch(matchId: string, replyToId: string): Promise<void> {
    const target = await this.prisma.message.findUnique({ where: { id: replyToId } });
    if (!target || target.matchId !== matchId) {
      throw new BadRequestException('Cannot reply to that message');
    }
  }
}
