import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { randomBytes } from 'crypto';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';
import { UpdateSubscriberDto } from './dto/update-subscriber.dto';
import { PlanEnforcementService } from '../plan-config/plan-enforcement.service';

@Injectable()
export class SubscribersService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private planEnforcement: PlanEnforcementService,
  ) {}

  private generateReferralCode(): string {
    return randomBytes(4).toString('base64url').toUpperCase().replace(/[-_]/g, 'A');
  }

  async create(projectId: string, dto: CreateSubscriberDto, ref?: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException('Project not found');

    // Check subscriber limit for the account's plan
    await this.planEnforcement.checkSubscriberLimit(project.accountId);

    // Validate required custom fields
    const customFields = (project.customFields ?? []) as { fieldKey?: string; label?: string; required?: boolean }[];
    const requiredFields = customFields.filter((f) => f.required);
    if (requiredFields.length > 0) {
      const meta = (dto.metadata ?? {}) as Record<string, unknown>;
      const missing = requiredFields.filter(
        (f) => f.fieldKey && (meta[f.fieldKey] === undefined || meta[f.fieldKey] === ''),
      );
      if (missing.length > 0) {
        const names = missing.map((f) => f.label ?? f.fieldKey).join(', ');
        throw new BadRequestException(`Missing required fields: ${names}`);
      }
    }

    // Resolve ref query param to referrerId
    let referrerId: string | null = null;
    if (ref) {
      const referrer = await this.prisma.subscriber.findFirst({
        where: { projectId, referralCode: ref },
      });
      if (referrer) referrerId = referrer.id;
    }

    let code = this.generateReferralCode();
    while (await this.prisma.subscriber.findUnique({ where: { projectId, referralCode: code } }))
      code = this.generateReferralCode();

    const subscriber = await this.prisma.subscriber.create({
      data: {
        projectId,
        email: dto.email,
        name: dto.name,
        metadata: dto.metadata as object | undefined,
        referralCode: code,
        referrerId,
        source: dto.source || 'direct',
      },
    });

    this.eventEmitter.emit('waitlist.signup.created', {
      projectId,
      subscriber,
    });

    return subscriber;
  }

  async findAll(projectId: string, accountId: string, limit = 20, cursor?: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.accountId !== accountId) throw new NotFoundException('Project not found');
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

  async update(projectId: string, subscriberId: string, accountId: string, dto: UpdateSubscriberDto) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.accountId !== accountId) throw new NotFoundException('Project not found');
    const sub = await this.prisma.subscriber.findFirst({ where: { id: subscriberId, projectId } });
    if (!sub) throw new NotFoundException('Subscriber not found');
    return this.prisma.subscriber.update({
      where: { id: subscriberId },
      data: {
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.metadata !== undefined && { metadata: dto.metadata as object }),
        ...(dto.source !== undefined && { source: dto.source }),
      },
    });
  }

  async remove(projectId: string, subscriberId: string, accountId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.accountId !== accountId) throw new NotFoundException('Project not found');
    const sub = await this.prisma.subscriber.findFirst({ where: { id: subscriberId, projectId } });
    if (!sub) throw new NotFoundException('Subscriber not found');
    await this.prisma.subscriber.delete({ where: { id: subscriberId } });
    return { deleted: true };
  }
}
