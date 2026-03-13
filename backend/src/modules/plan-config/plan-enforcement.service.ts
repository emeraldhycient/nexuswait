import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class PlanEnforcementService {
  constructor(private prisma: PrismaService) {}

  async checkProjectLimit(accountId: string) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { plan: true },
    });
    if (!account) return;

    const config = await this.prisma.planConfig.findUnique({
      where: { tier: account.plan },
    });
    if (!config || config.maxProjects === null) return; // unlimited

    const count = await this.prisma.project.count({
      where: { accountId, status: { not: 'archived' } },
    });

    if (count >= config.maxProjects) {
      throw new ForbiddenException(
        `Your ${config.displayName} plan allows a maximum of ${config.maxProjects} project(s). Please upgrade to create more.`,
      );
    }
  }

  async checkSubscriberLimit(accountId: string) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { plan: true },
    });
    if (!account) return;

    const config = await this.prisma.planConfig.findUnique({
      where: { tier: account.plan },
    });
    if (!config || config.maxSubscribersMonth === null) return; // unlimited

    // Count subscribers created THIS calendar month (UTC)
    const now = new Date();
    const firstOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    const count = await this.prisma.subscriber.count({
      where: {
        project: { accountId },
        createdAt: { gte: firstOfMonth },
      },
    });

    if (count >= config.maxSubscribersMonth) {
      throw new ForbiddenException(
        `Your ${config.displayName} plan allows ${config.maxSubscribersMonth.toLocaleString()} signups per month. Please upgrade for more capacity.`,
      );
    }
  }

  async checkIntegrationLimit(accountId: string) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { plan: true },
    });
    if (!account) return;

    const config = await this.prisma.planConfig.findUnique({
      where: { tier: account.plan },
    });
    if (!config || config.maxIntegrations === null) return; // unlimited

    const count = await this.prisma.integration.count({
      where: { project: { accountId } },
    });

    if (count >= config.maxIntegrations) {
      throw new ForbiddenException(
        `Your ${config.displayName} plan allows a maximum of ${config.maxIntegrations} integration(s). Please upgrade for more.`,
      );
    }
  }

  async getUsage(accountId: string) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { plan: true },
    });
    if (!account) {
      return {
        projects: { used: 0, limit: null },
        signups: { used: 0, limit: null },
        integrations: { used: 0, limit: null },
      };
    }

    const config = await this.prisma.planConfig.findUnique({
      where: { tier: account.plan },
    });

    const now = new Date();
    const firstOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    const [projectCount, signupCount, integrationCount] = await Promise.all([
      this.prisma.project.count({
        where: { accountId, status: { not: 'archived' } },
      }),
      this.prisma.subscriber.count({
        where: {
          project: { accountId },
          createdAt: { gte: firstOfMonth },
        },
      }),
      this.prisma.integration.count({
        where: { project: { accountId } },
      }),
    ]);

    return {
      projects: { used: projectCount, limit: config?.maxProjects ?? null },
      signups: { used: signupCount, limit: config?.maxSubscribersMonth ?? null },
      integrations: { used: integrationCount, limit: config?.maxIntegrations ?? null },
    };
  }
}
