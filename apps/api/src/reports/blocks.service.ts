import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BlocksService {
  constructor(private readonly prisma: PrismaService) {}

  async block(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new BadRequestException('You cannot block yourself');
    }
    try {
      return await this.prisma.block.create({ data: { blockerId, blockedId } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return this.prisma.block.findUniqueOrThrow({
          where: { blockerId_blockedId: { blockerId, blockedId } },
        });
      }
      throw error;
    }
  }

  async unblock(blockerId: string, blockedId: string) {
    await this.prisma.block.deleteMany({ where: { blockerId, blockedId } });
    return { ok: true };
  }

  listMine(blockerId: string) {
    return this.prisma.block.findMany({ where: { blockerId }, orderBy: { createdAt: 'desc' } });
  }
}
