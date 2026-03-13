import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

export interface CreateInAppNotificationInput {
  accountId: string;
  title: string;
  body: string;
  type?: string;
  actionUrl?: string;
}

@Injectable()
export class InAppNotificationService {
  private readonly logger = new Logger(InAppNotificationService.name);

  constructor(private prisma: PrismaService) {}

  /* ───── CRUD ─────────────────────────────────────────── */

  async create(input: CreateInAppNotificationInput) {
    return this.prisma.inAppNotification.create({
      data: {
        accountId: input.accountId,
        title: input.title,
        body: input.body,
        type: input.type ?? 'info',
        actionUrl: input.actionUrl,
      },
    });
  }

  async findAll(accountId: string, opts: { unreadOnly?: boolean; limit?: number; offset?: number } = {}) {
    const { unreadOnly = false, limit = 30, offset = 0 } = opts;
    return this.prisma.inAppNotification.findMany({
      where: {
        accountId,
        ...(unreadOnly ? { readAt: null } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async unreadCount(accountId: string): Promise<number> {
    return this.prisma.inAppNotification.count({
      where: { accountId, readAt: null },
    });
  }

  async markRead(accountId: string, id: string) {
    return this.prisma.inAppNotification.updateMany({
      where: { id, accountId },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(accountId: string) {
    return this.prisma.inAppNotification.updateMany({
      where: { accountId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async remove(accountId: string, id: string) {
    return this.prisma.inAppNotification.deleteMany({
      where: { id, accountId },
    });
  }

  /* ───── Event Listeners ──────────────────────────────── */

  @OnEvent('waitlist.signup.created')
  async onSignup(payload: { projectId: string; subscriber: { email: string; name?: string } }) {
    try {
      // Look up the project's account to create the notification
      const project = await this.prisma.project.findUnique({
        where: { id: payload.projectId },
        select: { accountId: true, name: true },
      });
      if (!project) return;

      // Check preferences — skip if in_app is disabled for this event
      const pref = await this.prisma.notificationPreference.findUnique({
        where: {
          accountId_event: {
            accountId: project.accountId,
            event: 'waitlist.signup.created',
          },
        },
      });
      if (pref && (!pref.enabled || !pref.channels.includes('in_app'))) return;

      const subscriberLabel = payload.subscriber.name || payload.subscriber.email;
      await this.create({
        accountId: project.accountId,
        title: 'New Signup',
        body: `${subscriberLabel} joined the ${project.name} waitlist.`,
        type: 'success',
        actionUrl: `/dashboard/project/${payload.projectId}`,
      });
    } catch (err) {
      this.logger.warn(`Failed to create in-app notification for signup: ${err}`);
    }
  }

  @OnEvent('integration.webhook.failed')
  async onWebhookFailed(payload: { integrationId: string; projectId: string; error: string }) {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id: payload.projectId },
        select: { accountId: true, name: true },
      });
      if (!project) return;

      const pref = await this.prisma.notificationPreference.findUnique({
        where: {
          accountId_event: {
            accountId: project.accountId,
            event: 'integration.webhook.failed',
          },
        },
      });
      if (pref && (!pref.enabled || !pref.channels.includes('in_app'))) return;

      await this.create({
        accountId: project.accountId,
        title: 'Webhook Delivery Failed',
        body: `A webhook for ${project.name} failed: ${payload.error.slice(0, 120)}`,
        type: 'error',
        actionUrl: '/dashboard/form-integrations',
      });
    } catch (err) {
      this.logger.warn(`Failed to create in-app notification for webhook failure: ${err}`);
    }
  }
}
