import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client/client';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  private async verifyOwnership(projectId: string, accountId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project || project.accountId !== accountId) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  async getOverview(projectId: string, accountId: string) {
    await this.verifyOwnership(projectId, accountId);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalSubscribers, subscribersToday, subscribersThisWeek, verifiedCount, referralCount] =
      await Promise.all([
        this.prisma.subscriber.count({ where: { projectId } }),
        this.prisma.subscriber.count({
          where: { projectId, createdAt: { gte: startOfToday } },
        }),
        this.prisma.subscriber.count({
          where: { projectId, createdAt: { gte: sevenDaysAgo } },
        }),
        this.prisma.subscriber.count({
          where: { projectId, verifiedAt: { not: null } },
        }),
        this.prisma.subscriber.count({
          where: { projectId, referrerId: { not: null } },
        }),
      ]);

    return {
      totalSubscribers,
      subscribersToday,
      subscribersThisWeek,
      verifiedCount,
      referralCount,
    };
  }

  async getTimeseries(
    projectId: string,
    accountId: string,
    period: string,
    granularity: string,
  ) {
    await this.verifyOwnership(projectId, accountId);

    const match = period.match(/^(\d+)d$/);
    const days = match ? parseInt(match[1], 10) : 7;

    const validGranularities = ['day', 'week', 'month'];
    const safeGranularity = validGranularities.includes(granularity)
      ? granularity
      : 'day';

    const rows = await this.prisma.$queryRaw<
      { date: Date; count: number }[]
    >(
      Prisma.sql`SELECT date_trunc(${safeGranularity}, created_at) as date, COUNT(*)::int as count
        FROM "Subscriber"
        WHERE project_id = ${projectId}
          AND created_at >= NOW() - cast(${days + ' days'} as interval)
        GROUP BY date
        ORDER BY date`,
    );

    return rows.map((row: { date: Date; count: number }) => ({
      date: row.date.toISOString(),
      count: Number(row.count),
    }));
  }

  async getSources(projectId: string, accountId: string) {
    await this.verifyOwnership(projectId, accountId);

    const groups = await this.prisma.subscriber.groupBy({
      by: ['source'],
      where: { projectId },
      _count: true,
    });

    return groups.map((g: { source: string | null; _count: number }) => ({
      source: g.source || 'direct',
      count: g._count,
    }));
  }
}
