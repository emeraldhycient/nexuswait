import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class EmailNotificationService {
  private readonly logger = new Logger(EmailNotificationService.name);
  private frontendUrl: string;

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private config: ConfigService,
  ) {
    this.frontendUrl = config.get<string>('FRONTEND_URL') || 'http://localhost:5173';
  }

  /* ───── Private Helpers ────────────────────────────── */

  private async getAccountEmail(accountId: string): Promise<string | null> {
    const user = await this.prisma.user.findFirst({
      where: { accountId },
      select: { email: true },
    });
    return user?.email ?? null;
  }

  private async findTemplate(eventName: string): Promise<string | null> {
    const template = await this.prisma.notificationTemplate.findFirst({
      where: { name: eventName, channel: 'email', accountId: null },
    });
    return template?.id ?? null;
  }

  private async enqueueIfEnabled(
    event: string,
    accountId: string,
    payload: Record<string, string>,
  ) {
    try {
      const pref = await this.prisma.notificationPreference.findUnique({
        where: { accountId_event: { accountId, event } },
      });
      if (pref && (!pref.enabled || !pref.channels.includes('email'))) return;

      const email = await this.getAccountEmail(accountId);
      if (!email) return;

      const templateId = await this.findTemplate(event);
      if (!templateId) {
        this.logger.warn(`No email template found for event: ${event}`);
        return;
      }

      await this.notifications.enqueue(templateId, email, payload);
    } catch (err) {
      this.logger.warn(`Failed to enqueue email notification for ${event}: ${err}`);
    }
  }

  /* ───── Event Listeners ──────────────────────────────── */

  @OnEvent('waitlist.signup.created')
  async onSignup(payload: { projectId: string; subscriber: { email: string; name?: string } }) {
    const project = await this.prisma.project.findUnique({
      where: { id: payload.projectId },
      select: { accountId: true, name: true },
    });
    if (!project) return;

    await this.enqueueIfEnabled('waitlist.signup.created', project.accountId, {
      projectName: project.name,
      subscriberLabel: payload.subscriber.name || payload.subscriber.email,
      actionUrl: `${this.frontendUrl}/dashboard/project/${payload.projectId}`,
    });
  }

  @OnEvent('project.created')
  async onProjectCreated(payload: { accountId: string; project: { id: string; name: string; slug: string } }) {
    await this.enqueueIfEnabled('project.created', payload.accountId, {
      projectName: payload.project.name,
      actionUrl: `${this.frontendUrl}/dashboard/project/${payload.project.id}`,
    });
  }

  @OnEvent('project.archived')
  async onProjectArchived(payload: { accountId: string; project: { id: string; name: string } }) {
    await this.enqueueIfEnabled('project.archived', payload.accountId, {
      projectName: payload.project.name,
      actionUrl: `${this.frontendUrl}/dashboard/projects`,
    });
  }

  @OnEvent('integration.created')
  async onIntegrationCreated(payload: { accountId: string; projectId: string; integration: { id: string; type: string; displayName: string } }) {
    const project = await this.prisma.project.findUnique({
      where: { id: payload.projectId },
      select: { name: true },
    });

    await this.enqueueIfEnabled('integration.created', payload.accountId, {
      projectName: project?.name || 'Unknown',
      integrationType: payload.integration.type,
      integrationName: payload.integration.displayName,
      actionUrl: `${this.frontendUrl}/dashboard/form-integrations`,
    });
  }

  @OnEvent('integration.removed')
  async onIntegrationRemoved(payload: { accountId: string; projectId: string; integration: { id: string; type: string; displayName: string } }) {
    const project = await this.prisma.project.findUnique({
      where: { id: payload.projectId },
      select: { name: true },
    });

    await this.enqueueIfEnabled('integration.removed', payload.accountId, {
      projectName: project?.name || 'Unknown',
      integrationType: payload.integration.type,
      integrationName: payload.integration.displayName,
      actionUrl: `${this.frontendUrl}/dashboard/form-integrations`,
    });
  }

  @OnEvent('integration.webhook.failed')
  async onWebhookFailed(payload: { integrationId: string; projectId: string; error: string }) {
    const project = await this.prisma.project.findUnique({
      where: { id: payload.projectId },
      select: { accountId: true, name: true },
    });
    if (!project) return;

    await this.enqueueIfEnabled('integration.webhook.failed', project.accountId, {
      projectName: project.name,
      error: payload.error.slice(0, 200),
      actionUrl: `${this.frontendUrl}/dashboard/form-integrations`,
    });
  }

  @OnEvent('subscription.upgraded')
  async onSubscriptionUpgraded(payload: { accountId: string; plan: string; previousPlan: string }) {
    await this.enqueueIfEnabled('subscription.upgraded', payload.accountId, {
      planName: payload.plan,
      previousPlan: payload.previousPlan,
      actionUrl: `${this.frontendUrl}/dashboard/settings`,
    });
  }

  @OnEvent('subscription.cancelled')
  async onSubscriptionCancelled(payload: { accountId: string }) {
    await this.enqueueIfEnabled('subscription.cancelled', payload.accountId, {
      actionUrl: `${this.frontendUrl}/dashboard/settings`,
    });
  }

  @OnEvent('subscriber.milestone')
  async onSubscriberMilestone(payload: { accountId: string; projectId: string; projectName: string; count: number }) {
    await this.enqueueIfEnabled('subscriber.milestone', payload.accountId, {
      projectName: payload.projectName,
      count: String(payload.count),
      actionUrl: `${this.frontendUrl}/dashboard/project/${payload.projectId}`,
    });
  }

  @OnEvent('api-key.created')
  async onApiKeyCreated(payload: { accountId: string; keyPrefix: string; type: string }) {
    await this.enqueueIfEnabled('api-key.created', payload.accountId, {
      keyPrefix: payload.keyPrefix,
      keyType: payload.type,
      actionUrl: `${this.frontendUrl}/dashboard/api`,
    });
  }

  @OnEvent('api-key.revoked')
  async onApiKeyRevoked(payload: { accountId: string; keyPrefix: string }) {
    await this.enqueueIfEnabled('api-key.revoked', payload.accountId, {
      keyPrefix: payload.keyPrefix,
      actionUrl: `${this.frontendUrl}/dashboard/api`,
    });
  }

  @OnEvent('hosted-page.published')
  async onHostedPagePublished(payload: { accountId: string; projectId: string; page: { slug: string; title: string } }) {
    await this.enqueueIfEnabled('hosted-page.published', payload.accountId, {
      pageName: payload.page.title,
      actionUrl: `${this.frontendUrl}/dashboard/hosted-page`,
    });
  }
}
