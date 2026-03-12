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
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [
      totalSignups,
      signupsThisWeek,
      signupsPrevWeek,
      referralCount,
      referralsPrevWeek,
      subscribersToday,
    ] = await Promise.all([
      this.prisma.subscriber.count({ where: { projectId } }),
      this.prisma.subscriber.count({
        where: { projectId, createdAt: { gte: sevenDaysAgo } },
      }),
      this.prisma.subscriber.count({
        where: {
          projectId,
          createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
        },
      }),
      this.prisma.subscriber.count({
        where: { projectId, referrerId: { not: null } },
      }),
      this.prisma.subscriber.count({
        where: {
          projectId,
          referrerId: { not: null },
          createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
        },
      }),
      this.prisma.subscriber.count({
        where: { projectId, createdAt: { gte: startOfToday } },
      }),
    ]);

    // Compute derived metrics
    const referralRate =
      totalSignups > 0
        ? Math.round((referralCount / totalSignups) * 100)
        : 0;
    const avgDaily =
      signupsThisWeek > 0 ? Math.round((signupsThisWeek / 7) * 10) / 10 : 0;

    // Week-over-week change strings
    const pctChange = (curr: number, prev: number): string => {
      if (prev === 0) return curr > 0 ? '+100%' : '';
      const diff = Math.round(((curr - prev) / prev) * 100);
      return diff > 0 ? `+${diff}%` : diff < 0 ? `${diff}%` : '0%';
    };

    const prevReferralRate =
      signupsPrevWeek > 0
        ? Math.round((referralsPrevWeek / signupsPrevWeek) * 100)
        : 0;
    const prevAvgDaily =
      signupsPrevWeek > 0
        ? Math.round((signupsPrevWeek / 7) * 10) / 10
        : 0;

    return {
      totalSignups,
      pageViews: totalSignups, // no separate page-view tracking yet; mirror signups
      referralRate,
      avgDaily,
      signupChange: pctChange(signupsThisWeek, signupsPrevWeek),
      viewsChange: pctChange(signupsThisWeek, signupsPrevWeek),
      referralChange: pctChange(referralRate, prevReferralRate),
      dailyChange: pctChange(avgDaily, prevAvgDaily),
      // raw counts still available for other consumers
      subscribersToday,
      signupsThisWeek,
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

    // Use Prisma.raw for SQL keywords/literals that can't be parameterized
    const truncField = Prisma.raw(`'${safeGranularity}'`);
    const intervalLiteral = Prisma.raw(`'${days} days'`);

    const rows = await this.prisma.$queryRaw<
      { date: Date; count: number }[]
    >(
      Prisma.sql`SELECT date_trunc(${truncField}, "created_at") as "date", COUNT(*)::int as "count"
        FROM "Subscriber"
        WHERE "project_id" = ${projectId}
          AND "created_at" >= NOW() - ${intervalLiteral}::interval
        GROUP BY 1
        ORDER BY 1`,
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

    const total = groups.reduce(
      (sum: number, g: { _count: number }) => sum + g._count,
      0,
    );

    return groups.map((g: { source: string | null; _count: number }) => ({
      source: g.source || 'direct',
      count: g._count,
      pct: total > 0 ? Math.round((g._count / total) * 100) : 0,
    }));
  }
}
