import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

interface TemplateSeed {
  name: string;
  channel: string;
  subject: string;
  body: string;
}

export const PLATFORM_TEMPLATES: TemplateSeed[] = [
  {
    name: 'waitlist.signup.created',
    channel: 'email',
    subject: 'New signup on {{projectName}}',
    body: '<p><strong>{{subscriberLabel}}</strong> just joined your <strong>{{projectName}}</strong> waitlist.</p><p><a href="{{actionUrl}}">View subscribers</a></p>',
  },
  {
    name: 'project.created',
    channel: 'email',
    subject: 'Project "{{projectName}}" created',
    body: '<p>Your new project <strong>{{projectName}}</strong> has been created and is ready to accept signups.</p><p><a href="{{actionUrl}}">View project</a></p>',
  },
  {
    name: 'project.archived',
    channel: 'email',
    subject: 'Project "{{projectName}}" archived',
    body: '<p>Your project <strong>{{projectName}}</strong> has been archived. It will no longer accept new signups.</p><p><a href="{{actionUrl}}">View projects</a></p>',
  },
  {
    name: 'integration.created',
    channel: 'email',
    subject: 'Integration added to {{projectName}}',
    body: '<p>A new <strong>{{integrationType}}</strong> integration (<strong>{{integrationName}}</strong>) has been connected to <strong>{{projectName}}</strong>.</p><p><a href="{{actionUrl}}">Manage integrations</a></p>',
  },
  {
    name: 'integration.removed',
    channel: 'email',
    subject: 'Integration removed from {{projectName}}',
    body: '<p>The <strong>{{integrationType}}</strong> integration (<strong>{{integrationName}}</strong>) has been removed from <strong>{{projectName}}</strong>.</p><p><a href="{{actionUrl}}">Manage integrations</a></p>',
  },
  {
    name: 'integration.webhook.failed',
    channel: 'email',
    subject: 'Webhook failed for {{projectName}}',
    body: '<p>A webhook integration for <strong>{{projectName}}</strong> has been auto-disabled after repeated failures.</p><p>Error: {{error}}</p><p><a href="{{actionUrl}}">Review integrations</a></p>',
  },
  {
    name: 'subscription.upgraded',
    channel: 'email',
    subject: 'Plan upgraded to {{planName}}',
    body: '<p>Your NexusWait plan has been upgraded to <strong>{{planName}}</strong>. Enjoy your new features!</p><p><a href="{{actionUrl}}">View billing</a></p>',
  },
  {
    name: 'subscription.cancelled',
    channel: 'email',
    subject: 'Subscription cancelled',
    body: '<p>Your NexusWait subscription has been cancelled. Your account has been moved to the Spark (free) plan.</p><p><a href="{{actionUrl}}">View billing</a></p>',
  },
  {
    name: 'subscriber.milestone',
    channel: 'email',
    subject: '{{projectName}} reached {{count}} subscribers!',
    body: '<p>Congratulations! Your project <strong>{{projectName}}</strong> has reached <strong>{{count}}</strong> subscribers.</p><p><a href="{{actionUrl}}">View project</a></p>',
  },
  {
    name: 'api-key.created',
    channel: 'email',
    subject: 'New API key generated',
    body: '<p>A new <strong>{{keyType}}</strong> API key (<code>{{keyPrefix}}...</code>) has been generated for your account.</p><p><a href="{{actionUrl}}">Manage API keys</a></p>',
  },
  {
    name: 'api-key.revoked',
    channel: 'email',
    subject: 'API key revoked',
    body: '<p>An API key (<code>{{keyPrefix}}...</code>) has been revoked from your account. Any integrations using this key will stop working.</p><p><a href="{{actionUrl}}">Manage API keys</a></p>',
  },
  {
    name: 'hosted-page.published',
    channel: 'email',
    subject: '{{pageName}} is now live',
    body: '<p>Your hosted page <strong>{{pageName}}</strong> has been published and is now live.</p><p><a href="{{actionUrl}}">View page settings</a></p>',
  },
];

@Injectable()
export class NotificationTemplateSeederService implements OnModuleInit {
  private readonly logger = new Logger(NotificationTemplateSeederService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    let created = 0;
    let updated = 0;

    for (const t of PLATFORM_TEMPLATES) {
      const existing = await this.prisma.notificationTemplate.findFirst({
        where: { name: t.name, channel: t.channel, accountId: null },
      });

      if (existing) {
        if (existing.subject !== t.subject || existing.body !== t.body) {
          await this.prisma.notificationTemplate.update({
            where: { id: existing.id },
            data: { subject: t.subject, body: t.body },
          });
          updated++;
        }
      } else {
        await this.prisma.notificationTemplate.create({
          data: {
            name: t.name,
            channel: t.channel,
            subject: t.subject,
            body: t.body,
            accountId: null,
          },
        });
        created++;
      }
    }

    if (created > 0 || updated > 0) {
      this.logger.log(`Seeded ${PLATFORM_TEMPLATES.length} notification templates (${created} created, ${updated} updated)`);
    }
  }
}
