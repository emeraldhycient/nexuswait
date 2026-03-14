import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import axios from 'axios';
import { PlanTier } from '../../generated/prisma/client/enums';
import { createHmac, timingSafeEqual } from 'crypto';

const POLAR_API = 'https://api.polar.sh/v1';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  // ──────────────────────────────────────────────
  //  Webhook signature verification
  // ──────────────────────────────────────────────

  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
    const secret = this.config.get<string>('POLAR_WEBHOOK_SECRET');
    if (!secret) {
      this.logger.error('POLAR_WEBHOOK_SECRET not configured — rejecting webhook');
      return false;
    }
    if (!signature) return false;

    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    try {
      return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
    } catch {
      return false;
    }
  }

  // ──────────────────────────────────────────────
  //  Checkout
  // ──────────────────────────────────────────────

  async createCheckoutSession(accountId: string, productId: string, successUrl: string, cancelUrl: string, customerEmail?: string) {
    const token = this.config.get<string>('POLAR_ACCESS_TOKEN');
    if (!token) {
      return { url: `${this.config.get('FRONTEND_URL') || 'http://localhost:5173'}/dashboard/settings?billing=1` };
    }
    const { data } = await axios.post(
      `${POLAR_API}/checkouts/`,
      {
        product_id: productId,
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: customerEmail,
        metadata: { accountId },
        external_customer_id: accountId,
      },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
    );
    return { url: data.url || data.checkout?.url };
  }

  // ──────────────────────────────────────────────
  //  Cancel subscription
  // ──────────────────────────────────────────────

  async cancelSubscription(accountId: string) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { polarSubscriptionId: true },
    });
    if (!account?.polarSubscriptionId) {
      return { status: 'no_active_subscription' };
    }

    const token = this.config.get<string>('POLAR_ACCESS_TOKEN');
    if (token) {
      try {
        await axios.delete(
          `${POLAR_API}/subscriptions/${account.polarSubscriptionId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
      } catch (error) {
        this.logger.warn(
          `Failed to cancel Polar subscription: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return { status: 'cancellation_requested' };
  }

  // ──────────────────────────────────────────────
  //  Dynamic product → plan mapping
  // ──────────────────────────────────────────────

  async mapProductToPlan(productId: string): Promise<PlanTier> {
    const planConfig = await this.prisma.planConfig.findFirst({
      where: {
        OR: [
          { polarProductIdMonthly: productId },
          { polarProductIdYearly: productId },
        ],
      },
    });
    if (planConfig) return planConfig.tier;

    // Fallback to env vars for backward compatibility
    const pulse = this.config.get('POLAR_PRODUCT_ID_PULSE');
    const nexus = this.config.get('POLAR_PRODUCT_ID_NEXUS');
    if (productId === nexus) return 'nexus';
    if (productId === pulse) return 'pulse';
    return 'spark';
  }

  // ──────────────────────────────────────────────
  //  Incoming webhook handler (with idempotency)
  // ──────────────────────────────────────────────

  async handlePolarWebhook(payload: Record<string, unknown>) {
    const eventId = payload.id as string | undefined;
    const type = payload.type as string;

    // Idempotency check
    if (eventId) {
      const existing = await this.prisma.webhookEvent.findUnique({
        where: { eventId },
      });
      if (existing) {
        this.logger.log(`Skipping duplicate webhook event: ${eventId}`);
        return { skipped: true };
      }
    }

    try {
      if (type === 'subscription.created' || type === 'subscription.updated') {
        const data = payload.data as Record<string, unknown>;
        const polarSubscriptionId = (data.id ?? (data as Record<string, unknown>).subscription_id) as string;
        const polarCustomerId = (data.customer_id ?? (data as Record<string, unknown>).customer_id) as string;
        const productId = (data.product_id ?? (data as Record<string, unknown>).product_id) as string | undefined;
        const externalCustomerId = (data.metadata as Record<string, string>)?.accountId ?? (data.external_customer_id as string);
        if (!externalCustomerId) return;
        const account = await this.prisma.account.findUnique({ where: { id: externalCustomerId } });
        if (!account) return;
        const previousPlan = account.plan;
        const plan = productId ? await this.mapProductToPlan(productId) : 'spark';
        await this.prisma.polarSubscription.upsert({
          where: { accountId: account.id },
          create: {
            accountId: account.id,
            polarSubscriptionId: String(polarSubscriptionId),
            polarCustomerId: String(polarCustomerId),
            plan,
            status: 'active',
          },
          update: {
            polarSubscriptionId: String(polarSubscriptionId),
            polarCustomerId: String(polarCustomerId),
            plan,
            status: 'active',
          },
        });
        await this.prisma.account.update({
          where: { id: account.id },
          data: { plan, polarCustomerId: String(polarCustomerId), polarSubscriptionId: String(polarSubscriptionId) },
        });

        this.eventEmitter.emit('subscription.upgraded', {
          accountId: account.id,
          plan,
          previousPlan,
        });
      }

      if (type === 'subscription.cancelled' || type === 'subscription.revoked') {
        const data = payload.data as Record<string, unknown>;
        const externalCustomerId = (data.metadata as Record<string, string>)?.accountId ?? (data.external_customer_id as string);
        if (!externalCustomerId) return;
        await this.prisma.polarSubscription.updateMany({
          where: { accountId: externalCustomerId },
          data: { status: 'cancelled' },
        });
        await this.prisma.account.update({
          where: { id: externalCustomerId },
          data: { plan: 'spark', polarSubscriptionId: null },
        });

        this.eventEmitter.emit('subscription.cancelled', {
          accountId: externalCustomerId,
        });
      }

      // Record successful processing
      if (eventId) {
        await this.prisma.webhookEvent.create({
          data: {
            eventId,
            eventType: type,
            payload: payload as object,
            status: 'processed',
          },
        });
      }
    } catch (error) {
      // Record failed processing
      if (eventId) {
        await this.prisma.webhookEvent.create({
          data: {
            eventId,
            eventType: type,
            payload: payload as object,
            status: 'failed',
            error: error instanceof Error ? error.message : String(error),
          },
        });
      }
      throw error;
    }
  }
}
