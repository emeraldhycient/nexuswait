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

  /* ───── Private Helper ─────────────────────────────── */

  async notifyIfEnabled(
    event: string,
    accountId: string,
    opts: { title: string; body: string; type?: string; actionUrl?: string },
  ) {
    try {
      const pref = await this.prisma.notificationPreference.findUnique({
        where: { accountId_event: { accountId, event } },
      });
      if (pref && (!pref.enabled || !pref.channels.includes('in_app'))) return;

      await this.create({
        accountId,
        title: opts.title,
        body: opts.body,
        type: opts.type ?? 'info',
        actionUrl: opts.actionUrl,
      });
    } catch (err) {
      this.logger.warn(`Failed to create in-app notification for ${event}: ${err}`);
    }
  }

  /* ───── Event Listeners ──────────────────────────────── */

  @OnEvent('waitlist.signup.created')
  async onSignup(payload: { projectId: string; subscriber: { email: string; name?: string } }) {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id: payload.projectId },
        select: { accountId: true, name: true },
      });
      if (!project) return;

      const subscriberLabel = payload.subscriber.name || payload.subscriber.email;
      await this.notifyIfEnabled('waitlist.signup.created', project.accountId, {
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

      await this.notifyIfEnabled('integration.webhook.failed', project.accountId, {
        title: 'Webhook Delivery Failed',
        body: `A webhook for ${project.name} failed: ${payload.error.slice(0, 120)}`,
        type: 'error',
        actionUrl: '/dashboard/form-integrations',
      });
    } catch (err) {
      this.logger.warn(`Failed to create in-app notification for webhook failure: ${err}`);
    }
  }

  @OnEvent('project.created')
  async onProjectCreated(payload: { accountId: string; project: { id: string; name: string; slug: string } }) {
    await this.notifyIfEnabled('project.created', payload.accountId, {
      title: 'Project Created',
      body: `Your project "${payload.project.name}" has been created.`,
      type: 'success',
      actionUrl: `/dashboard/project/${payload.project.id}`,
    });
  }

  @OnEvent('project.archived')
  async onProjectArchived(payload: { accountId: string; project: { id: string; name: string } }) {
    await this.notifyIfEnabled('project.archived', payload.accountId, {
      title: 'Project Archived',
      body: `Your project "${payload.project.name}" has been archived.`,
      type: 'warning',
      actionUrl: '/dashboard/projects',
    });
  }

  @OnEvent('integration.created')
  async onIntegrationCreated(payload: { accountId: string; projectId: string; integration: { id: string; type: string; displayName: string } }) {
    await this.notifyIfEnabled('integration.created', payload.accountId, {
      title: 'Integration Connected',
      body: `${payload.integration.displayName} (${payload.integration.type}) has been connected.`,
      type: 'success',
      actionUrl: '/dashboard/form-integrations',
    });
  }

  @OnEvent('integration.removed')
  async onIntegrationRemoved(payload: { accountId: string; projectId: string; integration: { id: string; type: string; displayName: string } }) {
    await this.notifyIfEnabled('integration.removed', payload.accountId, {
      title: 'Integration Removed',
      body: `${payload.integration.displayName} (${payload.integration.type}) has been removed.`,
      type: 'info',
      actionUrl: '/dashboard/form-integrations',
    });
  }

  @OnEvent('subscription.upgraded')
  async onSubscriptionUpgraded(payload: { accountId: string; plan: string; previousPlan: string }) {
    await this.notifyIfEnabled('subscription.upgraded', payload.accountId, {
      title: 'Plan Upgraded',
      body: `Your plan has been upgraded to ${payload.plan}.`,
      type: 'success',
      actionUrl: '/dashboard/settings',
    });
  }

  @OnEvent('subscription.cancelled')
  async onSubscriptionCancelled(payload: { accountId: string }) {
    await this.notifyIfEnabled('subscription.cancelled', payload.accountId, {
      title: 'Subscription Cancelled',
      body: 'Your subscription has been cancelled. You are now on the Spark (free) plan.',
      type: 'warning',
      actionUrl: '/dashboard/settings',
    });
  }

  @OnEvent('subscriber.milestone')
  async onSubscriberMilestone(payload: { accountId: string; projectId: string; projectName: string; count: number }) {
    await this.notifyIfEnabled('subscriber.milestone', payload.accountId, {
      title: 'Milestone Reached!',
      body: `${payload.projectName} has reached ${payload.count} subscribers!`,
      type: 'success',
      actionUrl: `/dashboard/project/${payload.projectId}`,
    });
  }

  @OnEvent('api-key.created')
  async onApiKeyCreated(payload: { accountId: string; keyPrefix: string; type: string }) {
    await this.notifyIfEnabled('api-key.created', payload.accountId, {
      title: 'API Key Created',
      body: `A new ${payload.type} API key (${payload.keyPrefix}...) has been generated.`,
      type: 'info',
      actionUrl: '/dashboard/api',
    });
  }

  @OnEvent('api-key.revoked')
  async onApiKeyRevoked(payload: { accountId: string; keyPrefix: string }) {
    await this.notifyIfEnabled('api-key.revoked', payload.accountId, {
      title: 'API Key Revoked',
      body: `API key ${payload.keyPrefix}... has been revoked.`,
      type: 'warning',
      actionUrl: '/dashboard/api',
    });
  }

  @OnEvent('hosted-page.published')
  async onHostedPagePublished(payload: { accountId: string; projectId: string; page: { slug: string; title: string } }) {
    await this.notifyIfEnabled('hosted-page.published', payload.accountId, {
      title: 'Page Published',
      body: `Your hosted page "${payload.page.title}" is now live.`,
      type: 'success',
      actionUrl: '/dashboard/hosted-page',
    });
  }
}
