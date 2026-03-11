import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtPayloadDecorator } from './jwt-payload.decorator';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Controller('account')
@UseGuards(AuthGuard('jwt'))
export class AccountController {
  constructor(private prisma: PrismaService) {}

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
    if (!account) return { plan: 'spark', usage: { projects: 0, signups: 0 } };
    const [projectsCount, signupsCount] = await Promise.all([
      this.prisma.project.count({ where: { accountId: payload.accountId } }),
      this.prisma.subscriber.count({
        where: { project: { accountId: payload.accountId } },
      }),
    ]);
    return {
      plan: account.plan,
      usage: { projects: projectsCount, signups: signupsCount },
      nextBillingDate: null,
    };
  }
}
