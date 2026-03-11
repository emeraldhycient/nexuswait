import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { randomBytes } from 'crypto';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';

@Injectable()
export class SubscribersService {
  constructor(private prisma: PrismaService) {}

  private generateReferralCode(): string {
    return randomBytes(4).toString('base64url').toUpperCase().replace(/[-_]/g, 'A');
  }

  async create(projectId: string, dto: CreateSubscriberDto, referrerId?: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');
    let code = this.generateReferralCode();
    while (await this.prisma.subscriber.findUnique({ where: { projectId, referralCode: code } }))
      code = this.generateReferralCode();
    return this.prisma.subscriber.create({
      data: {
        projectId,
        email: dto.email,
        name: dto.name,
        metadata: dto.metadata as object | undefined,
        referralCode: code,
        referrerId: referrerId || null,
        source: dto.source || 'direct',
      },
    });
  }

  async findAll(projectId: string, accountId: string, limit = 20, cursor?: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.accountId !== accountId) throw new NotFoundException('Project not found');
    const subscribers = await this.prisma.subscriber.findMany({
      where: { projectId },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
      include: { referrer: { select: { id: true, email: true, referralCode: true } } },
    });
    const hasMore = subscribers.length > limit;
    const items = hasMore ? subscribers.slice(0, limit) : subscribers;
    return { data: items, nextCursor: hasMore ? items[items.length - 1].id : null };
  }

  async getCount(projectId: string) {
    return this.prisma.subscriber.count({ where: { projectId } });
  }

  async findOne(projectId: string, subscriberId: string, accountId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.accountId !== accountId) throw new NotFoundException('Project not found');
    const sub = await this.prisma.subscriber.findFirst({
      where: { id: subscriberId, projectId },
      include: { referrer: { select: { id: true, email: true, referralCode: true } }, _count: { select: { referred: true } } },
    });
    if (!sub) throw new NotFoundException('Subscriber not found');
    return sub;
  }
}
