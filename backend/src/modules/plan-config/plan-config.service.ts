import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { PlanTier } from '../../generated/prisma/client/enums';
import { UpsertPlanConfigDto } from './dto/upsert-plan-config.dto';

const DEFAULT_PLANS: Array<{
  tier: PlanTier;
  displayName: string;
  description: string;
  monthlyPriceCents: number;
  yearlyPriceCents: number;
  maxProjects: number | null;
  maxSubscribersMonth: number | null;
  maxIntegrations: number | null;
  features: string[];
  highlight: boolean;
  ctaText: string;
  sortOrder: number;
}> = [
  {
    tier: 'spark',
    displayName: 'Spark',
    description: 'For side projects & MVPs',
    monthlyPriceCents: 0,
    yearlyPriceCents: 0,
    maxProjects: 1,
    maxSubscribersMonth: 500,
    maxIntegrations: 2,
    features: [
      '1 waitlist',
      '500 signups / month',
      'Basic analytics',
      'Email notifications',
      '2 integrations',
      'Community support',
    ],
    highlight: false,
    ctaText: 'Get Started',
    sortOrder: 0,
  },
  {
    tier: 'pulse',
    displayName: 'Pulse',
    description: 'For growing products',
    monthlyPriceCents: 2900,
    yearlyPriceCents: 2400,
    maxProjects: 10,
    maxSubscribersMonth: 25000,
    maxIntegrations: 25,
    features: [
      'Up to 10 waitlists',
      '25,000 signups / month',
      'Advanced analytics + referrals',
      'Custom branding & hosted pages',
      '25 integrations',
      'Priority email support',
      'API access',
    ],
    highlight: true,
    ctaText: 'Upgrade to Pulse',
    sortOrder: 1,
  },
  {
    tier: 'nexus',
    displayName: 'Nexus',
    description: 'Unlimited scale',
    monthlyPriceCents: 9900,
    yearlyPriceCents: 7900,
    maxProjects: null,
    maxSubscribersMonth: null,
    maxIntegrations: null,
    features: [
      'Unlimited waitlists',
      'Unlimited signups',
      'Full analytics suite',
      'White-label hosted pages',
      'Unlimited integrations',
      'Webhooks + advanced API',
      'Dedicated account manager',
      'SSO & team support',
    ],
    highlight: false,
    ctaText: 'Go Nexus',
    sortOrder: 2,
  },
  {
    tier: 'enterprise',
    displayName: 'Enterprise',
    description: 'Custom solutions',
    monthlyPriceCents: 0,
    yearlyPriceCents: 0,
    maxProjects: null,
    maxSubscribersMonth: null,
    maxIntegrations: null,
    features: [
      'Everything in Nexus',
      'Custom contracts & SLA',
      'On-premise option',
      'Dedicated infrastructure',
      'Custom integrations',
      'Priority 24/7 support',
    ],
    highlight: false,
    ctaText: 'Contact Sales',
    sortOrder: 3,
  },
];

@Injectable()
export class PlanConfigService implements OnModuleInit {
  private readonly logger = new Logger(PlanConfigService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seed();
  }

  private async seed() {
    const existing = await this.prisma.planConfig.count();
    if (existing > 0) return;

    this.logger.log('Seeding default plan configs...');
    for (const plan of DEFAULT_PLANS) {
      await this.prisma.planConfig.create({ data: plan });
    }
    this.logger.log(`Seeded ${DEFAULT_PLANS.length} plan configs`);
  }

  async getAll() {
    return this.prisma.planConfig.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async getByTier(tier: PlanTier) {
    return this.prisma.planConfig.findUnique({ where: { tier } });
  }

  async upsert(tier: PlanTier, dto: UpsertPlanConfigDto) {
    return this.prisma.planConfig.upsert({
      where: { tier },
      create: {
        tier,
        displayName: dto.displayName,
        description: dto.description,
        monthlyPriceCents: dto.monthlyPriceCents,
        yearlyPriceCents: dto.yearlyPriceCents,
        maxProjects: dto.maxProjects ?? null,
        maxSubscribersMonth: dto.maxSubscribersMonth ?? null,
        maxIntegrations: dto.maxIntegrations ?? null,
        features: dto.features,
        polarProductIdMonthly: dto.polarProductIdMonthly,
        polarProductIdYearly: dto.polarProductIdYearly,
        highlight: dto.highlight ?? false,
        ctaText: dto.ctaText ?? 'Get Started',
        sortOrder: dto.sortOrder ?? 0,
      },
      update: {
        displayName: dto.displayName,
        description: dto.description,
        monthlyPriceCents: dto.monthlyPriceCents,
        yearlyPriceCents: dto.yearlyPriceCents,
        maxProjects: dto.maxProjects ?? null,
        maxSubscribersMonth: dto.maxSubscribersMonth ?? null,
        maxIntegrations: dto.maxIntegrations ?? null,
        features: dto.features,
        polarProductIdMonthly: dto.polarProductIdMonthly,
        polarProductIdYearly: dto.polarProductIdYearly,
        highlight: dto.highlight ?? false,
        ctaText: dto.ctaText ?? 'Get Started',
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async delete(tier: PlanTier) {
    return this.prisma.planConfig.delete({ where: { tier } });
  }
}
