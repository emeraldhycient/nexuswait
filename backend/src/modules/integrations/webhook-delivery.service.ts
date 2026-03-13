import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { createHmac } from 'crypto';
import axios from 'axios';

@Injectable()
export class WebhookDeliveryService {
  private readonly logger = new Logger(WebhookDeliveryService.name);

  constructor(private prisma: PrismaService) {}

  @OnEvent('waitlist.signup.created')
  async handleSignup(payload: { projectId: string; subscriber: any }) {
    const integrations = await this.prisma.integration.findMany({
      where: {
        projectId: payload.projectId,
        enabled: true,
        events: { has: 'waitlist.signup.created' },
      },
    });

    for (const integration of integrations) {
      await this.deliverWebhook(integration, payload);
    }
  }

  async deliverWebhook(integration: any, payload: any) {
    const config = integration.config as Record<string, any>;
    if (integration.type !== 'webhook' || !config?.url) {
      return;
    }

    const body = JSON.stringify(payload);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (config.secret) {
      const signature = createHmac('sha256', config.secret)
        .update(body)
        .digest('hex');
      headers['X-NexusWait-Signature'] = signature;
    }

    try {
      await axios.post(config.url, payload, { headers, timeout: 10000 });
      await this.prisma.integration.update({
        where: { id: integration.id },
        data: {
          lastTriggeredAt: new Date(),
          failureCount: 0,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Webhook delivery failed for integration ${integration.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
      await this.prisma.integration.update({
        where: { id: integration.id },
        data: {
          failureCount: { increment: 1 },
        },
      });
    }
  }

  async deliverTest(integration: any) {
    const testPayload = {
      event: 'test',
      timestamp: new Date().toISOString(),
      integration: {
        id: integration.id,
        type: integration.type,
        displayName: integration.displayName,
      },
      data: {
        message: 'This is a test webhook delivery from NexusWait',
      },
    };

    await this.deliverWebhook(integration, testPayload);
  }
}
