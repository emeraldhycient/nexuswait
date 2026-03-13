import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtPayloadDecorator } from './jwt-payload.decorator';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { PlanEnforcementService } from '../plan-config/plan-enforcement.service';

@Controller('account')
@UseGuards(AuthGuard('jwt'))
export class AccountController {
  constructor(
    private prisma: PrismaService,
    private planEnforcement: PlanEnforcementService,
  ) {}

  @Get()
  async getAccount(@JwtPayloadDecorator() payload: { accountId: string }) {
    const account = await this.prisma.account.findUnique({
      where: { id: payload.accountId },
      select: { id: true, plan: true, polarCustomerId: true },
    });
    if (!account) return { account: null };
    return { account };
  }

  @Get('billing')
  async getBilling(@JwtPayloadDecorator() payload: { accountId: string }) {
    const account = await this.prisma.account.findUnique({
      where: { id: payload.accountId },
      select: { id: true, plan: true, polarSubscriptionId: true },
    });
    if (!account) return { plan: 'spark', usage: { projects: { used: 0, limit: null }, signups: { used: 0, limit: null }, integrations: { used: 0, limit: null } } };

    const [usage, planConfig, polarSubscription] = await Promise.all([
      this.planEnforcement.getUsage(payload.accountId),
      this.prisma.planConfig.findUnique({ where: { tier: account.plan } }),
      this.prisma.polarSubscription.findUnique({ where: { accountId: payload.accountId } }),
    ]);

    return {
      plan: account.plan,
      planConfig,
      usage,
      polarSubscription,
      nextBillingDate: null,
    };
  }
}
