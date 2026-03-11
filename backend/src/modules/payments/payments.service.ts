import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import axios from 'axios';
import { PlanTier } from '@prisma/client';

const POLAR_API = 'https://api.polar.sh/v1';

@Injectable()
export class PaymentsService {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

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

  mapProductToPlan(productId: string): PlanTier {
    const pulse = this.config.get('POLAR_PRODUCT_ID_PULSE');
    const nexus = this.config.get('POLAR_PRODUCT_ID_NEXUS');
    if (productId === nexus) return 'nexus';
    if (productId === pulse) return 'pulse';
    return 'spark';
  }

  async handlePolarWebhook(payload: Record<string, unknown>) {
    const type = payload.type as string;
    if (type === 'subscription.created' || type === 'subscription.updated') {
      const data = payload.data as Record<string, unknown>;
      const polarSubscriptionId = (data.id ?? (data as Record<string, unknown>).subscription_id) as string;
      const polarCustomerId = (data.customer_id ?? (data as Record<string, unknown>).customer_id) as string;
      const productId = (data.product_id ?? (data as Record<string, unknown>).product_id) as string | undefined;
      const externalCustomerId = (data.metadata as Record<string, string>)?.accountId ?? (data.external_customer_id as string);
      if (!externalCustomerId) return;
      const account = await this.prisma.account.findUnique({ where: { id: externalCustomerId } });
      if (!account) return;
      const plan = productId ? this.mapProductToPlan(productId) : 'spark';
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
    }
  }
}
