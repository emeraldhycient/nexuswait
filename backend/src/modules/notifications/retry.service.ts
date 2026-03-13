import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { WebhookDeliveryService } from '../integrations/webhook-delivery.service';

/** Exponential backoff delays: 30s, 2min, 10min, 30min, 1hr */
const RETRY_DELAYS_MS = [30_000, 120_000, 600_000, 1_800_000, 3_600_000];
const MAX_RETRY_ATTEMPTS = 5;
const POLL_INTERVAL_MS = 15_000; // Check every 15 seconds
const BATCH_SIZE = 25;

@Injectable()
export class RetryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RetryService.name);
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private prisma: PrismaService,
    private webhookDelivery: WebhookDeliveryService,
    private eventEmitter: EventEmitter2,
  ) {}

  onModuleInit() {
    this.intervalId = setInterval(() => this.processRetries(), POLL_INTERVAL_MS);
    this.logger.log('Retry service started — polling every 15s');
  }

  onModuleDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  /**
   * Find integrations with failures that are due for retry and re-deliver.
   * Uses failureCount as the retry counter and calculates next-eligible time
   * based on exponential backoff from updatedAt.
   */
  async processRetries() {
    try {
      const now = new Date();

      // Find integrations that have failed but haven't exceeded max retries
      const failedIntegrations = await this.prisma.integration.findMany({
        where: {
          enabled: true,
          failureCount: { gt: 0, lt: MAX_RETRY_ATTEMPTS },
        },
        include: { project: { select: { id: true, accountId: true, name: true } } },
        take: BATCH_SIZE,
      });

      for (const integration of failedIntegrations) {
        // Calculate next eligible retry time using exponential backoff
        const delayIndex = Math.min(integration.failureCount - 1, RETRY_DELAYS_MS.length - 1);
        const delay = RETRY_DELAYS_MS[delayIndex];
        const eligibleAt = new Date(integration.updatedAt.getTime() + delay);

        if (now < eligibleAt) continue; // Not yet eligible for retry

        this.logger.log(
          `Retrying webhook delivery for integration ${integration.id} (attempt ${integration.failureCount + 1}/${MAX_RETRY_ATTEMPTS})`,
        );

        try {
          const testPayload = {
            event: 'retry',
            timestamp: new Date().toISOString(),
            integration: {
              id: integration.id,
              type: integration.type,
              displayName: integration.displayName,
            },
            data: {
              message: 'Retry delivery from NexusWait',
              attempt: integration.failureCount + 1,
            },
          };

          await this.webhookDelivery.deliverWebhook(integration, testPayload);

          // If we get here without throwing, the delivery succeeded
          // and deliverWebhook already reset failureCount to 0
          this.logger.log(`Retry succeeded for integration ${integration.id}`);
        } catch {
          // deliverWebhook handles failure internally (increments failureCount)
          this.logger.warn(`Retry failed for integration ${integration.id}`);

          // If we've hit max retries, auto-disable and emit event
          const updated = await this.prisma.integration.findUnique({
            where: { id: integration.id },
            select: { failureCount: true },
          });

          if (updated && updated.failureCount >= MAX_RETRY_ATTEMPTS) {
            await this.prisma.integration.update({
              where: { id: integration.id },
              data: { enabled: false },
            });

            this.logger.warn(
              `Integration ${integration.id} disabled after ${MAX_RETRY_ATTEMPTS} consecutive failures`,
            );

            // Emit event so in-app notification is created
            this.eventEmitter.emit('integration.webhook.failed', {
              integrationId: integration.id,
              projectId: integration.project.id,
              error: `Auto-disabled after ${MAX_RETRY_ATTEMPTS} consecutive delivery failures.`,
            });
          }
        }
      }
    } catch (err) {
      this.logger.error(`Retry service error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /** Manual retry trigger from the API */
  async retryIntegration(integrationId: string) {
    const integration = await this.prisma.integration.findUnique({
      where: { id: integrationId },
    });
    if (!integration) return { success: false, message: 'Integration not found' };

    // Reset failure count to allow deliveries again
    await this.prisma.integration.update({
      where: { id: integrationId },
      data: { failureCount: 0, enabled: true },
    });

    return { success: true, message: 'Integration re-enabled and failure count reset' };
  }
}
