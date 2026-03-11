import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { NotificationStatus } from '@prisma/client';

const RETRY_DELAYS_MS = [1000, 10000, 60000]; // 1s, 10s, 60s

@Injectable()
export class NotificationWorkerService implements OnModuleInit, OnModuleDestroy {
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    this.intervalId = setInterval(() => this.processBatch(), 5000);
  }

  onModuleDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private async processBatch() {
    const now = new Date();
    const pending = await this.prisma.notification.findMany({
      where: {
        OR: [
          { status: NotificationStatus.pending },
          { status: NotificationStatus.failed, nextRetryAt: { lte: now } },
        ],
      },
      take: 50,
      include: { template: true },
    });

    for (const n of pending) {
      if (n.attempts >= n.maxAttempts || !n.template) continue;
      try {
        await this.sendOne(n.id, n.recipient, n.payload, n.attempts, n.maxAttempts, n.template.body);
      } catch (e) {
        // continue with next
      }
    }
  }

  private async sendOne(
    id: string,
    recipient: string,
    payload: unknown,
    attempts: number,
    maxAttempts: number,
    bodyTemplate: string,
  ) {
    // Placeholder: substitute placeholders and "send" (e.g. email). For now we just mark sent for testing.
    const payloadObj = (typeof payload === 'object' && payload !== null ? payload : {}) as Record<string, string>;
    const body = this.substitute(bodyTemplate, payloadObj);
    try {
      // TODO: inject ISendNotification adapter (SendGrid, etc.)
      console.log(`[NotificationWorker] Would send to ${recipient}: ${body.slice(0, 80)}...`);
      await this.prisma.notification.update({
        where: { id },
        data: {
          status: NotificationStatus.sent,
          sentAt: new Date(),
          attempts: attempts + 1,
        },
      });
    } catch (err) {
      const newAttempts = attempts + 1;
      const delay = RETRY_DELAYS_MS[Math.min(newAttempts - 1, RETRY_DELAYS_MS.length - 1)];
      const nextRetryAt = newAttempts >= maxAttempts ? null : new Date(Date.now() + delay);
      const status = newAttempts >= maxAttempts ? NotificationStatus.dead_letter : NotificationStatus.failed;
      await this.prisma.notification.update({
        where: { id },
        data: {
          status,
          attempts: newAttempts,
          nextRetryAt,
          lastError: err instanceof Error ? err.message : String(err),
        },
      });
    }
  }

  private substitute(template: string, payload: Record<string, string>): string {
    let out = template;
    for (const [k, v] of Object.entries(payload)) {
      out = out.replace(new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, 'g'), String(v));
    }
    return out;
  }
}
