import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { NotificationStatus } from '../../generated/prisma/client/enums';
import { Resend } from 'resend';

const RETRY_DELAYS_MS = [1000, 10000, 60000]; // 1s, 10s, 60s

@Injectable()
export class NotificationWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationWorkerService.name);
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private resend: Resend;
  private from: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.resend = new Resend(config.get<string>('RESEND_API_KEY'));
    this.from = config.get<string>('EMAIL_FROM') || 'NexusWait <noreply@nexuswait.com>';
  }

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
        await this.sendOne(
          n.id,
          n.recipient,
          n.payload,
          n.attempts,
          n.maxAttempts,
          n.template.body,
          n.template.subject,
        );
      } catch {
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
    subjectTemplate: string | null,
  ) {
    const payloadObj = (typeof payload === 'object' && payload !== null ? payload : {}) as Record<string, string>;
    const body = this.substitute(bodyTemplate, payloadObj);
    const subject = subjectTemplate
      ? this.substitute(subjectTemplate, payloadObj)
      : 'NexusWait Notification';

    try {
      const { error } = await this.resend.emails.send({
        from: this.from,
        to: recipient,
        subject,
        html: body,
      });

      if (error) throw new Error(error.message);

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

  substitute(template: string, payload: Record<string, string>): string {
    let out = template;
    for (const [k, v] of Object.entries(payload)) {
      out = out.replace(new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, 'g'), String(v));
    }
    return out;
  }
}
