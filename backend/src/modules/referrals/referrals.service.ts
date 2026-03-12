import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class ReferralsService {
  constructor(private prisma: PrismaService) {}

  private async verifyOwnership(projectId: string, accountId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project || project.accountId !== accountId) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  async getLeaderboard(projectId: string, accountId: string, limit = 20) {
    await this.verifyOwnership(projectId, accountId);

    return this.prisma.subscriber.findMany({
      where: {
        projectId,
        referred: { some: {} },
      },
      include: {
        _count: { select: { referred: true } },
      },
      orderBy: {
        referred: { _count: 'desc' },
      },
      take: limit,
    });
  }

  async findAll(
    projectId: string,
    accountId: string,
    limit = 20,
    cursor?: string,
  ) {
    await this.verifyOwnership(projectId, accountId);

    const subscribers = await this.prisma.subscriber.findMany({
      where: { projectId },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
      include: {
        referrer: { select: { id: true, email: true, referralCode: true } },
        _count: { select: { referred: true } },
      },
    });

    const hasMore = subscribers.length > limit;
    const items = hasMore ? subscribers.slice(0, limit) : subscribers;

    return {
      data: items,
      nextCursor: hasMore ? items[items.length - 1].id : null,
    };
  }
}
