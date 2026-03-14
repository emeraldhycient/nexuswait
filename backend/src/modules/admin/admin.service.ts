import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { UpdateAccountDto } from './dto/update-account.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import {
  IntegrationType,
  NotificationStatus,
  PlanTier,
  ProjectStatus,
  UserRole,
} from '../../generated/prisma/client/enums';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ──────────────────────────────────────────────
  //  Platform-wide statistics
  // ──────────────────────────────────────────────

  async getStats() {
    const [totalAccounts, totalUsers, totalProjects, totalSubscribers, planBreakdown] =
      await Promise.all([
        this.prisma.account.count(),
        this.prisma.user.count(),
        this.prisma.project.count(),
        this.prisma.subscriber.count(),
        this.prisma.account.groupBy({
          by: ['plan'],
          _count: true,
        }),
      ]);

    return {
      totalAccounts,
      totalUsers,
      totalProjects,
      totalSubscribers,
      planBreakdown: planBreakdown.map(
        (entry: { plan: PlanTier; _count: number }) => ({
          plan: entry.plan,
          count: entry._count,
        }),
      ),
    };
  }

  // ──────────────────────────────────────────────
  //  Accounts
  // ──────────────────────────────────────────────

  async getAccounts(params: {
    search?: string;
    plan?: PlanTier;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(params.page ?? 1, 1);
    const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (params.plan) {
      where.plan = params.plan;
    }

    if (params.search) {
      where.users = {
        some: {
          email: { contains: params.search, mode: 'insensitive' },
        },
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.account.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { users: true, projects: true },
          },
          users: {
            select: { email: true, firstName: true, lastName: true, roles: true },
            take: 5,
          },
        },
      }),
      this.prisma.account.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getAccount(id: string) {
    const account = await this.prisma.account.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            roles: true,
            createdAt: true,
          },
        },
        projects: {
          include: {
            _count: { select: { subscribers: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        polarSubscription: true,
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  async updateAccount(id: string, dto: UpdateAccountDto) {
    const account = await this.prisma.account.findUnique({ where: { id } });
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const data: Record<string, unknown> = {};
    if (dto.plan !== undefined) {
      data.plan = dto.plan;
    }

    return this.prisma.account.update({
      where: { id },
      data,
    });
  }

  // ──────────────────────────────────────────────
  //  Users
  // ──────────────────────────────────────────────

  async getUsers(params: {
    search?: string;
    role?: UserRole;
    accountId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(params.page ?? 1, 1);
    const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (params.role) {
      where.roles = { has: params.role };
    }

    if (params.accountId) {
      where.accountId = params.accountId;
    }

    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: 'insensitive' } },
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          roles: true,
          provider: true,
          avatarUrl: true,
          createdAt: true,
          accountId: true,
          account: {
            select: { id: true, plan: true },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        roles: true,
        provider: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        accountId: true,
        account: {
          select: {
            id: true,
            plan: true,
            createdAt: true,
            _count: { select: { users: true, projects: true } },
            projects: {
              select: {
                id: true,
                name: true,
                slug: true,
                status: true,
                _count: { select: { subscribers: true } },
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUser(
    id: string,
    dto: AdminUpdateUserDto,
    requestingUserId: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Self-protection: admin cannot remove their own admin role
    if (id === requestingUserId && dto.roles !== undefined) {
      const currentlyAdmin = (user.roles as string[]).includes('admin');
      const wouldRemoveAdmin = !dto.roles.includes('admin');
      if (currentlyAdmin && wouldRemoveAdmin) {
        throw new ForbiddenException('Cannot remove your own admin role');
      }
    }

    const data: Record<string, unknown> = {};

    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;
    if (dto.roles !== undefined) data.roles = dto.roles;

    if (dto.email !== undefined) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException('Email already in use');
      }
      data.email = dto.email;
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        roles: true,
        provider: true,
        avatarUrl: true,
        accountId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deleteUser(id: string, requestingUserId: string) {
    if (id === requestingUserId) {
      throw new ForbiddenException('Cannot delete your own account');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({ where: { id } });
    return { success: true, message: 'User deleted' };
  }

  async resetUserPassword(id: string, temporaryPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.provider === 'google' && !user.passwordHash) {
      throw new BadRequestException(
        'This user uses Google sign-in only. Cannot set a password.',
      );
    }

    const passwordHash = await bcrypt.hash(temporaryPassword, 10);
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    return { success: true, message: 'Password has been reset' };
  }

  // ──────────────────────────────────────────────
  //  Account subscribers (cross-project)
  // ──────────────────────────────────────────────

  async getAccountSubscribers(
    accountId: string,
    params: { search?: string; page?: number; limit?: number },
  ) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: { id: true, projects: { select: { id: true } } },
    });
    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const page = Math.max(params.page ?? 1, 1);
    const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
    const skip = (page - 1) * limit;

    const projectIds = account.projects.map(
      (p: { id: string }) => p.id,
    );
    const where: Record<string, unknown> = {
      projectId: { in: projectIds },
    };

    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: 'insensitive' } },
        { name: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.subscriber.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          project: { select: { id: true, name: true } },
        },
      }),
      this.prisma.subscriber.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  // ──────────────────────────────────────────────
  //  Projects
  // ──────────────────────────────────────────────

  async getProjects(params: {
    search?: string;
    status?: ProjectStatus;
    accountId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(params.page ?? 1, 1);
    const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (params.status) {
      where.status = params.status;
    }

    if (params.accountId) {
      where.accountId = params.accountId;
    }

    if (params.search) {
      where.name = { contains: params.search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { subscribers: true, integrations: true },
          },
          account: {
            select: { id: true, plan: true },
          },
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async updateProject(id: string, dto: UpdateProjectDto) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const data: Record<string, unknown> = {};
    if (dto.status !== undefined) {
      data.status = dto.status;
    }

    return this.prisma.project.update({
      where: { id },
      data,
    });
  }

  // ──────────────────────────────────────────────
  //  Subscribers
  // ──────────────────────────────────────────────

  async getRecentSubscribers(limit = 50) {
    return this.prisma.subscriber.findMany({
      take: Math.min(limit, 200),
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          select: { id: true, name: true, accountId: true },
        },
      },
    });
  }

  async getFlaggedSubscribers() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find subscribers who referred more than 10 people in the last 24 hours.
    // We group the recent referrals by referrerId and filter for count > 10.
    const suspiciousReferrers = await this.prisma.subscriber.groupBy({
      by: ['referrerId'],
      where: {
        referrerId: { not: null },
        createdAt: { gte: oneDayAgo },
      },
      _count: true,
      having: {
        referrerId: { _count: { gt: 10 } },
      },
    });

    if (suspiciousReferrers.length === 0) {
      return [];
    }

    const referrerIds = suspiciousReferrers
      .map((r: { referrerId: string | null }) => r.referrerId)
      .filter((id: string | null): id is string => id !== null);

    const flagged = await this.prisma.subscriber.findMany({
      where: { id: { in: referrerIds } },
      include: {
        project: { select: { id: true, name: true } },
        _count: { select: { referred: true } },
      },
    });

    // Attach the 24h referral count from the groupBy result
    const countMap = new Map<string | null, number>(
      suspiciousReferrers.map(
        (r: { referrerId: string | null; _count: number }) =>
          [r.referrerId, r._count] as [string | null, number],
      ),
    );

    return flagged.map((subscriber: { id: string; [key: string]: unknown }) => ({
      ...subscriber,
      referralsLast24h: countMap.get(subscriber.id) ?? 0,
    }));
  }

  // ──────────────────────────────────────────────
  //  Integration health
  // ──────────────────────────────────────────────

  async getIntegrationHealth() {
    const health = await this.prisma.integration.groupBy({
      by: ['type'],
      _count: true,
      _avg: { failureCount: true },
      _sum: { failureCount: true },
    });

    // Separately count integrations with failures per type
    const failing = await this.prisma.integration.groupBy({
      by: ['type'],
      where: { failureCount: { gt: 0 } },
      _count: true,
    });

    const failingMap = new Map<IntegrationType, number>(
      failing.map(
        (f: { type: IntegrationType; _count: number }) =>
          [f.type, f._count] as [IntegrationType, number],
      ),
    );

    return health.map(
      (entry: {
        type: IntegrationType;
        _count: number;
        _avg: { failureCount: number | null };
        _sum: { failureCount: number | null };
      }) => ({
        type: entry.type,
        total: entry._count,
        avgFailureCount: entry._avg.failureCount ?? 0,
        totalFailures: entry._sum.failureCount ?? 0,
        deadCount: failingMap.get(entry.type) ?? 0,
      }),
    );
  }

  // ──────────────────────────────────────────────
  //  Notification queue
  // ──────────────────────────────────────────────

  async getNotificationQueue() {
    const [statusCounts, recentFailed] = await Promise.all([
      this.prisma.notification.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.notification.findMany({
        where: { status: { in: ['failed', 'dead_letter'] } },
        take: 20,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          templateId: true,
          recipient: true,
          status: true,
          attempts: true,
          lastError: true,
          createdAt: true,
        },
      }),
    ]);

    const countMap: Record<string, number> = {};
    for (const s of statusCounts as Array<{
      status: NotificationStatus;
      _count: number;
    }>) {
      countMap[s.status] = s._count;
    }

    return {
      pending: countMap['pending'] ?? 0,
      sent: countMap['sent'] ?? 0,
      failed: countMap['failed'] ?? 0,
      deadLetter: countMap['dead_letter'] ?? 0,
      recentFailed,
    };
  }

  // ──────────────────────────────────────────────
  //  Failed integrations + retry
  // ──────────────────────────────────────────────

  async getFailedIntegrations() {
    return this.prisma.integration.findMany({
      where: { failureCount: { gt: 0 } },
      orderBy: { failureCount: 'desc' },
      take: 50,
      include: {
        project: {
          select: { id: true, name: true, accountId: true },
        },
      },
    });
  }

  async retryIntegration(id: string) {
    const integration = await this.prisma.integration.findUnique({ where: { id } });
    if (!integration) {
      throw new NotFoundException('Integration not found');
    }
    await this.prisma.integration.update({
      where: { id },
      data: { failureCount: 0, enabled: true },
    });
    return { success: true, message: 'Integration re-enabled and failure count reset' };
  }

  // ──────────────────────────────────────────────
  //  Notification templates (admin view — all)
  // ──────────────────────────────────────────────

  async getNotificationTemplates() {
    return this.prisma.notificationTemplate.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { notifications: true } },
      },
    });
  }

  // ──────────────────────────────────────────────
  //  Global search (admin)
  // ──────────────────────────────────────────────

  async globalSearch(q: string) {
    if (!q || q.length < 2)
      return { users: [], projects: [], subscribers: [], integrations: [] };

    const [users, projects, subscribers, integrations] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: q, mode: 'insensitive' } },
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          roles: true,
        },
      }),
      this.prisma.project.findMany({
        where: { name: { contains: q, mode: 'insensitive' } },
        take: 5,
        select: { id: true, name: true, status: true },
      }),
      this.prisma.subscriber.findMany({
        where: {
          OR: [
            { email: { contains: q, mode: 'insensitive' } },
            { name: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, email: true, name: true, projectId: true },
      }),
      this.prisma.integration.findMany({
        where: { displayName: { contains: q, mode: 'insensitive' } },
        take: 5,
        select: { id: true, displayName: true, type: true, projectId: true },
      }),
    ]);

    return { users, projects, subscribers, integrations };
  }

  // ──────────────────────────────────────────────
  //  Delivery logs + webhook events
  // ──────────────────────────────────────────────

  async getDeliveryLogs(integrationId: string, page = 1, limit = 20) {
    const skip = (Math.max(page, 1) - 1) * Math.min(limit, 100);
    const take = Math.min(limit, 100);

    const [data, total] = await Promise.all([
      this.prisma.webhookDeliveryLog.findMany({
        where: { integrationId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.webhookDeliveryLog.count({ where: { integrationId } }),
    ]);

    return { data, total, page, limit: take };
  }

  async retriggerDelivery(logId: string) {
    const log = await this.prisma.webhookDeliveryLog.findUnique({
      where: { id: logId },
      include: { integration: true },
    });
    if (!log) throw new NotFoundException('Delivery log not found');

    const integration = log.integration;
    const config = integration.config as Record<string, any>;
    if (!config?.url) {
      return { success: false, message: 'Integration has no webhook URL' };
    }

    // Create a new delivery log with a fresh idempotency key
    const { createHmac } = await import('crypto');
    const axios = (await import('axios')).default;

    const body = JSON.stringify(log.payload);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (config.secret) {
      headers['X-NexusWait-Signature'] = createHmac('sha256', config.secret).update(body).digest('hex');
    }

    const idempotencyKey = `retrigger:${logId}:${Date.now()}`;
    const startTime = Date.now();

    try {
      const response = await axios.post(config.url, log.payload, { headers, timeout: 10000 });
      await this.prisma.webhookDeliveryLog.create({
        data: {
          integrationId: integration.id,
          event: log.event,
          payload: log.payload as object,
          idempotencyKey,
          responseStatus: response.status,
          responseBody: JSON.stringify(response.data).slice(0, 2048),
          durationMs: Date.now() - startTime,
          success: true,
        },
      });
      return { success: true, message: 'Delivery retriggered successfully' };
    } catch (error: any) {
      await this.prisma.webhookDeliveryLog.create({
        data: {
          integrationId: integration.id,
          event: log.event,
          payload: log.payload as object,
          idempotencyKey,
          responseStatus: error.response?.status ?? null,
          responseBody: error.response?.data ? JSON.stringify(error.response.data).slice(0, 2048) : null,
          durationMs: Date.now() - startTime,
          error: error.message,
          success: false,
        },
      });
      return { success: false, message: `Retrigger failed: ${error.message}` };
    }
  }

  async getWebhookEvents(page = 1, limit = 20) {
    const skip = (Math.max(page, 1) - 1) * Math.min(limit, 100);
    const take = Math.min(limit, 100);

    const [data, total] = await Promise.all([
      this.prisma.webhookEvent.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.webhookEvent.count(),
    ]);

    return { data, total, page, limit: take };
  }

  async updateIntegrationConfig(id: string, body: { maxRetryAttempts?: number }) {
    const integration = await this.prisma.integration.findUnique({ where: { id } });
    if (!integration) throw new NotFoundException('Integration not found');

    const data: Record<string, unknown> = {};
    if (body.maxRetryAttempts !== undefined) {
      data.maxRetryAttempts = Math.max(1, Math.min(body.maxRetryAttempts, 20));
    }

    return this.prisma.integration.update({ where: { id }, data });
  }

  // ──────────────────────────────────────────────
  //  System health
  // ──────────────────────────────────────────────

  async getSystemHealth() {
    let dbHealthy = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbHealthy = true;
    } catch {
      dbHealthy = false;
    }

    const pendingNotifications = await this.prisma.notification.count({
      where: { status: 'pending' },
    });

    return {
      database: dbHealthy ? 'connected' : 'disconnected',
      notificationQueueDepth: pendingNotifications,
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }
}
