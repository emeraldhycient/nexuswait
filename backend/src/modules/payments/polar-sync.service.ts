import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import axios from 'axios';

const POLAR_API = 'https://api.polar.sh/v1';

/**
 * Name-based mapping from Polar product names to plan tiers.
 *
 * Polar product naming convention:
 *   - "Spark"          → tier: spark   (free, no product IDs needed)
 *   - "Pulse"          → tier: pulse   monthly
 *   - "Pulse_annual"   → tier: pulse   yearly
 *   - "Nexus"          → tier: nexus   monthly
 *   - "Nexus_annual"   → tier: nexus   yearly
 */
const PRODUCT_NAME_MAP: Record<string, { tier: string; billing: 'monthly' | 'yearly' }> = {
  pulse:        { tier: 'pulse',  billing: 'monthly' },
  pulse_annual: { tier: 'pulse',  billing: 'yearly' },
  nexus:        { tier: 'nexus',  billing: 'monthly' },
  nexus_annual: { tier: 'nexus',  billing: 'yearly' },
};

export interface PolarProduct {
  id: string;
  name: string;
  is_archived: boolean;
  prices?: Array<{ id: string; amount_type: string; price_amount?: number; recurring_interval?: string }>;
  [key: string]: unknown;
}

@Injectable()
export class PolarSyncService implements OnModuleInit {
  private readonly logger = new Logger(PolarSyncService.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async onModuleInit() {
    // Wait a tick so plan-config seeds complete first
    await new Promise((r) => setTimeout(r, 500));
    await this.syncProducts();
  }

  /**
   * Fetch all active products from Polar and update PlanConfig
   * with the corresponding product IDs.
   */
  async syncProducts(): Promise<{ synced: number; skipped: number }> {
    const token = this.config.get<string>('POLAR_ACCESS_TOKEN');
    if (!token) {
      this.logger.warn('POLAR_ACCESS_TOKEN not set — skipping product sync');
      return { synced: 0, skipped: 0 };
    }

    let products: PolarProduct[];
    try {
      products = await this.fetchProducts(token);
    } catch (error) {
      this.logger.error(
        `Failed to fetch Polar products: ${error instanceof Error ? error.message : String(error)}`,
      );
      return { synced: 0, skipped: 0 };
    }

    let synced = 0;
    let skipped = 0;

    // Group products by tier
    const tierUpdates: Record<string, { monthly?: string; yearly?: string }> = {};

    for (const product of products) {
      if (product.is_archived) {
        skipped++;
        continue;
      }

      const key = product.name.toLowerCase().trim();
      const mapping = PRODUCT_NAME_MAP[key];
      if (!mapping) {
        this.logger.debug(`Skipping unmapped Polar product: "${product.name}" (id: ${product.id})`);
        skipped++;
        continue;
      }

      if (!tierUpdates[mapping.tier]) {
        tierUpdates[mapping.tier] = {};
      }

      if (mapping.billing === 'monthly') {
        tierUpdates[mapping.tier].monthly = product.id;
      } else {
        tierUpdates[mapping.tier].yearly = product.id;
      }
    }

    // Apply updates to PlanConfig
    for (const [tier, ids] of Object.entries(tierUpdates)) {
      const existing = await this.prisma.planConfig.findUnique({
        where: { tier: tier as any },
      });

      if (!existing) {
        this.logger.warn(`PlanConfig for tier "${tier}" not found — skipping product ID update`);
        skipped++;
        continue;
      }

      const updateData: Record<string, string | null> = {};
      if (ids.monthly) updateData.polarProductIdMonthly = ids.monthly;
      if (ids.yearly) updateData.polarProductIdYearly = ids.yearly;

      if (Object.keys(updateData).length > 0) {
        await this.prisma.planConfig.update({
          where: { tier: tier as any },
          data: updateData,
        });
        this.logger.log(
          `Synced Polar product IDs for "${tier}": monthly=${ids.monthly ?? '(unchanged)'}, yearly=${ids.yearly ?? '(unchanged)'}`,
        );
        synced++;
      }
    }

    this.logger.log(`Polar product sync complete: ${synced} tier(s) updated, ${skipped} product(s) skipped`);
    return { synced, skipped };
  }

  /**
   * Fetch all products from Polar API with pagination.
   */
  async fetchProducts(token: string): Promise<PolarProduct[]> {
    const allProducts: PolarProduct[] = [];
    let page = 1;
    const limit = 100;

    while (true) {
      const { data } = await axios.get(`${POLAR_API}/products`, {
        params: { page, limit, is_archived: false },
        headers: { Authorization: `Bearer ${token}` },
      });

      const items: PolarProduct[] = data.items ?? data.result ?? data;
      if (!Array.isArray(items) || items.length === 0) break;

      allProducts.push(...items);

      // Polar uses cursor/page-based pagination
      if (items.length < limit) break;
      page++;
    }

    return allProducts;
  }
}
