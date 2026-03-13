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
      await this.deliverWebhook(integration, payload, 'waitlist.signup.created');
    }
  }

  async deliverWebhook(integration: any, payload: any, event?: string) {
    const config = integration.config as Record<string, any>;
    if (integration.type !== 'webhook' || !config?.url) {
      return;
    }

    const eventName = event || payload.event || 'unknown';

    // Generate idempotency key
    const subscriberId = payload.subscriber?.id || payload.data?.subscriberId || 'none';
    const minuteBucket = Math.floor(Date.now() / 60000);
    const idempotencyKey = `${eventName}:${subscriberId}:${integration.id}:${minuteBucket}`;

    // Check for existing successful delivery with this key
    const existing = await this.prisma.webhookDeliveryLog.findUnique({
      where: { idempotencyKey },
    });
    if (existing?.success) {
      this.logger.log(`Skipping duplicate delivery: ${idempotencyKey}`);
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

    const startTime = Date.now();

    try {
      const response = await axios.post(config.url, payload, { headers, timeout: 10000 });
      const durationMs = Date.now() - startTime;

      await this.prisma.integration.update({
        where: { id: integration.id },
        data: {
          lastTriggeredAt: new Date(),
          failureCount: 0,
        },
      });

      // Log successful delivery
      await this.prisma.webhookDeliveryLog.upsert({
        where: { idempotencyKey },
        create: {
          integrationId: integration.id,
          event: eventName,
          payload: payload as object,
          idempotencyKey,
          responseStatus: response.status,
          responseBody: JSON.stringify(response.data).slice(0, 2048),
          durationMs,
          success: true,
        },
        update: {
          responseStatus: response.status,
          responseBody: JSON.stringify(response.data).slice(0, 2048),
          durationMs,
          success: true,
          error: null,
        },
      });
    } catch (error: any) {
      const durationMs = Date.now() - startTime;

      this.logger.warn(
        `Webhook delivery failed for integration ${integration.id}: ${error instanceof Error ? error.message : String(error)}`,
      );

      await this.prisma.integration.update({
        where: { id: integration.id },
        data: {
          failureCount: { increment: 1 },
        },
      });

      // Log failed delivery
      await this.prisma.webhookDeliveryLog.upsert({
        where: { idempotencyKey },
        create: {
          integrationId: integration.id,
          event: eventName,
          payload: payload as object,
          idempotencyKey,
          responseStatus: error.response?.status ?? null,
          responseBody: error.response?.data ? JSON.stringify(error.response.data).slice(0, 2048) : null,
          durationMs,
          error: error instanceof Error ? error.message : String(error),
          success: false,
        },
        update: {
          responseStatus: error.response?.status ?? null,
          responseBody: error.response?.data ? JSON.stringify(error.response.data).slice(0, 2048) : null,
          durationMs,
          error: error instanceof Error ? error.message : String(error),
          success: false,
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

    await this.deliverWebhook(integration, testPayload, 'test');
  }
}
