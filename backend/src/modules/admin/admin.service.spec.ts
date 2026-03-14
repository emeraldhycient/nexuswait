import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrisma = {
      account: {
        count: jest.fn(),
        groupBy: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      user: {
        count: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      project: {
        count: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      subscriber: {
        count: jest.fn(),
        findMany: jest.fn(),
        groupBy: jest.fn(),
      },
      integration: {
        groupBy: jest.fn(),
      },
      notification: {
        groupBy: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      $queryRaw: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(AdminService);
    prisma = module.get(PrismaService);
  });

  // ──────────────────────────────────────────────
  //  getStats
  // ──────────────────────────────────────────────

  it('getStats returns platform-wide counts and plan breakdown', async () => {
    (prisma.account.count as jest.Mock).mockResolvedValue(10);
    (prisma.user.count as jest.Mock).mockResolvedValue(25);
    (prisma.project.count as jest.Mock).mockResolvedValue(8);
    (prisma.subscriber.count as jest.Mock).mockResolvedValue(300);
    (prisma.account.groupBy as jest.Mock).mockResolvedValue([
      { plan: 'spark', _count: 5 },
      { plan: 'pulse', _count: 3 },
      { plan: 'nexus', _count: 2 },
    ]);

    const result = await service.getStats();

    expect(result).toEqual({
      totalAccounts: 10,
      totalUsers: 25,
      totalProjects: 8,
      totalSubscribers: 300,
      planBreakdown: [
        { plan: 'spark', count: 5 },
        { plan: 'pulse', count: 3 },
        { plan: 'nexus', count: 2 },
      ],
    });
    expect(prisma.account.count).toHaveBeenCalled();
    expect(prisma.user.count).toHaveBeenCalled();
    expect(prisma.project.count).toHaveBeenCalled();
    expect(prisma.subscriber.count).toHaveBeenCalled();
    expect(prisma.account.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ by: ['plan'], _count: true }),
    );
  });

  // ──────────────────────────────────────────────
  //  getAccounts
  // ──────────────────────────────────────────────

  it('getAccounts returns paginated accounts with defaults', async () => {
    const mockAccounts = [{ id: 'acc-1', plan: 'spark' }];
    (prisma.account.findMany as jest.Mock).mockResolvedValue(mockAccounts);
    (prisma.account.count as jest.Mock).mockResolvedValue(1);

    const result = await service.getAccounts({});

    expect(result).toEqual({ data: mockAccounts, total: 1, page: 1, limit: 20 });
    expect(prisma.account.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 20, orderBy: { createdAt: 'desc' } }),
    );
  });

  it('getAccounts applies search filter', async () => {
    (prisma.account.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.account.count as jest.Mock).mockResolvedValue(0);

    await service.getAccounts({ search: 'test@example.com' });

    expect(prisma.account.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          users: {
            some: { email: { contains: 'test@example.com', mode: 'insensitive' } },
          },
        }),
      }),
    );
  });

  it('getAccounts applies plan filter', async () => {
    (prisma.account.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.account.count as jest.Mock).mockResolvedValue(0);

    await service.getAccounts({ plan: 'nexus' });

    expect(prisma.account.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ plan: 'nexus' }),
      }),
    );
  });

  // ──────────────────────────────────────────────
  //  getAccount
  // ──────────────────────────────────────────────

  it('getAccount returns account with includes', async () => {
    const mockAccount = {
      id: 'acc-1',
      plan: 'spark',
      users: [{ id: 'u1', email: 'a@b.com', firstName: 'A', lastName: 'B', role: 'owner', createdAt: new Date() }],
      projects: [],
      polarSubscription: null,
    };
    (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockAccount);

    const result = await service.getAccount('acc-1');

    expect(result).toEqual(mockAccount);
    expect(prisma.account.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'acc-1' },
        include: expect.objectContaining({
          users: expect.any(Object),
          projects: expect.any(Object),
          polarSubscription: true,
        }),
      }),
    );
  });

  it('getAccount throws NotFoundException for unknown id', async () => {
    (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.getAccount('unknown-id')).rejects.toThrow(NotFoundException);
  });

  // ──────────────────────────────────────────────
  //  updateAccount
  // ──────────────────────────────────────────────

  it('updateAccount updates plan', async () => {
    const existing = { id: 'acc-1', plan: 'spark' };
    const updated = { id: 'acc-1', plan: 'nexus' };
    (prisma.account.findUnique as jest.Mock).mockResolvedValue(existing);
    (prisma.account.update as jest.Mock).mockResolvedValue(updated);

    const result = await service.updateAccount('acc-1', { plan: 'nexus' });

    expect(result).toEqual(updated);
    expect(prisma.account.update).toHaveBeenCalledWith({
      where: { id: 'acc-1' },
      data: { plan: 'nexus' },
    });
  });

  it('updateAccount throws NotFoundException for unknown id', async () => {
    (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.updateAccount('unknown-id', { plan: 'nexus' })).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.account.update).not.toHaveBeenCalled();
  });

  // ──────────────────────────────────────────────
  //  getProjects
  // ──────────────────────────────────────────────

  it('getProjects returns paginated projects', async () => {
    const mockProjects = [{ id: 'p1', name: 'Project 1' }];
    (prisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects);
    (prisma.project.count as jest.Mock).mockResolvedValue(1);

    const result = await service.getProjects({});

    expect(result).toEqual({ data: mockProjects, total: 1, page: 1, limit: 20 });
    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 20, orderBy: { createdAt: 'desc' } }),
    );
  });

  it('getProjects applies filters', async () => {
    (prisma.project.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.project.count as jest.Mock).mockResolvedValue(0);

    await service.getProjects({ status: 'active', accountId: 'acc-1', search: 'beta' });

    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'active',
          accountId: 'acc-1',
          name: { contains: 'beta', mode: 'insensitive' },
        }),
      }),
    );
  });

  // ──────────────────────────────────────────────
  //  getProject
  // ──────────────────────────────────────────────

  it('getProject returns project with relations', async () => {
    const mockProject = {
      id: 'p1',
      name: 'Test Project',
      slug: 'test-project',
      status: 'active',
      account: { id: 'acc-1', plan: 'spark' },
      subscribers: [{ id: 's1', email: 'sub@test.com' }],
      integrations: [{ id: 'int-1', type: 'webhook' }],
      hostedPage: null,
      _count: { subscribers: 1, integrations: 1 },
    };
    (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);

    const result = await service.getProject('p1');

    expect(result).toEqual(mockProject);
    expect(prisma.project.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'p1' } }),
    );
  });

  it('getProject throws NotFoundException for unknown id', async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.getProject('unknown-id')).rejects.toThrow(
      NotFoundException,
    );
  });

  // ──────────────────────────────────────────────
  //  updateProject
  // ──────────────────────────────────────────────

  it('updateProject updates status', async () => {
    const existing = { id: 'p1', status: 'active' };
    const updated = { id: 'p1', status: 'paused' };
    (prisma.project.findUnique as jest.Mock).mockResolvedValue(existing);
    (prisma.project.update as jest.Mock).mockResolvedValue(updated);

    const result = await service.updateProject('p1', { status: 'paused' });

    expect(result).toEqual(updated);
    expect(prisma.project.update).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { status: 'paused' },
    });
  });

  it('updateProject throws NotFoundException', async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.updateProject('unknown-id', { status: 'paused' })).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.project.update).not.toHaveBeenCalled();
  });

  // ──────────────────────────────────────────────
  //  getRecentSubscribers
  // ──────────────────────────────────────────────

  it('getRecentSubscribers returns limited list', async () => {
    const mockSubscribers = [
      { id: 's1', email: 'sub@test.com', project: { id: 'p1', name: 'Proj', accountId: 'a1' } },
    ];
    (prisma.subscriber.findMany as jest.Mock).mockResolvedValue(mockSubscribers);

    const result = await service.getRecentSubscribers(10);

    expect(result).toEqual(mockSubscribers);
    expect(prisma.subscriber.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { project: { select: { id: true, name: true, accountId: true } } },
      }),
    );
  });

  // ──────────────────────────────────────────────
  //  getFlaggedSubscribers
  // ──────────────────────────────────────────────

  it('getFlaggedSubscribers returns empty when none suspicious', async () => {
    (prisma.subscriber.groupBy as jest.Mock).mockResolvedValue([]);

    const result = await service.getFlaggedSubscribers();

    expect(result).toEqual([]);
    expect(prisma.subscriber.findMany).not.toHaveBeenCalled();
  });

  it('getFlaggedSubscribers returns subscribers with 24h count', async () => {
    (prisma.subscriber.groupBy as jest.Mock).mockResolvedValue([
      { referrerId: 'ref-1', _count: 15 },
      { referrerId: 'ref-2', _count: 20 },
    ]);
    const flaggedSubscribers = [
      { id: 'ref-1', email: 'a@b.com', project: { id: 'p1', name: 'Proj' }, _count: { referred: 50 } },
      { id: 'ref-2', email: 'c@d.com', project: { id: 'p1', name: 'Proj' }, _count: { referred: 80 } },
    ];
    (prisma.subscriber.findMany as jest.Mock).mockResolvedValue(flaggedSubscribers);

    const result = await service.getFlaggedSubscribers();

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(expect.objectContaining({ id: 'ref-1', referralsLast24h: 15 }));
    expect(result[1]).toEqual(expect.objectContaining({ id: 'ref-2', referralsLast24h: 20 }));
    expect(prisma.subscriber.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ['ref-1', 'ref-2'] } },
      }),
    );
  });

  // ──────────────────────────────────────────────
  //  getIntegrationHealth
  // ──────────────────────────────────────────────

  it('getIntegrationHealth returns health metrics by type', async () => {
    const healthData = [
      { type: 'slack', _count: 10, _avg: { failureCount: 1.5 }, _sum: { failureCount: 15 } },
      { type: 'discord', _count: 5, _avg: { failureCount: 0 }, _sum: { failureCount: 0 } },
    ];
    const failingData = [{ type: 'slack', _count: 3 }];

    // First call: full health groupBy; second call: failing groupBy
    (prisma.integration.groupBy as jest.Mock)
      .mockResolvedValueOnce(healthData)
      .mockResolvedValueOnce(failingData);

    const result = await service.getIntegrationHealth();

    expect(result).toEqual([
      { type: 'slack', total: 10, avgFailureCount: 1.5, totalFailures: 15, deadCount: 3 },
      { type: 'discord', total: 5, avgFailureCount: 0, totalFailures: 0, deadCount: 0 },
    ]);
    expect(prisma.integration.groupBy).toHaveBeenCalledTimes(2);
  });

  // ──────────────────────────────────────────────
  //  getNotificationQueue
  // ──────────────────────────────────────────────

  it('getNotificationQueue returns status counts and recent failures', async () => {
    const statusCounts = [
      { status: 'pending', _count: 5 },
      { status: 'sent', _count: 100 },
      { status: 'failed', _count: 3 },
      { status: 'dead_letter', _count: 1 },
    ];
    const recentFailed = [
      {
        id: 'n1',
        templateId: 'tpl-1',
        recipient: 'user@test.com',
        status: 'failed',
        attempts: 3,
        lastError: 'timeout',
        createdAt: new Date(),
      },
    ];
    (prisma.notification.groupBy as jest.Mock).mockResolvedValue(statusCounts);
    (prisma.notification.findMany as jest.Mock).mockResolvedValue(recentFailed);

    const result = await service.getNotificationQueue();

    expect(result).toEqual({
      pending: 5,
      sent: 100,
      failed: 3,
      deadLetter: 1,
      recentFailed,
    });
    expect(prisma.notification.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ by: ['status'], _count: true }),
    );
    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: { in: ['failed', 'dead_letter'] } },
        take: 20,
        orderBy: { createdAt: 'desc' },
      }),
    );
  });

  // ──────────────────────────────────────────────
  //  getSystemHealth
  // ──────────────────────────────────────────────

  it('getSystemHealth returns connected when DB is healthy', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);
    (prisma.notification.count as jest.Mock).mockResolvedValue(7);

    const result = await service.getSystemHealth();

    expect(result.database).toBe('connected');
    expect(result.notificationQueueDepth).toBe(7);
    expect(typeof result.uptimeSeconds).toBe('number');
    expect(prisma.$queryRaw).toHaveBeenCalled();
  });

  it('getSystemHealth returns disconnected when DB fails', async () => {
    (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Connection refused'));
    (prisma.notification.count as jest.Mock).mockResolvedValue(0);

    const result = await service.getSystemHealth();

    expect(result.database).toBe('disconnected');
    expect(result.notificationQueueDepth).toBe(0);
    expect(typeof result.uptimeSeconds).toBe('number');
  });

  // ──────────────────────────────────────────────
  //  getUsers
  // ──────────────────────────────────────────────

  it('getUsers returns paginated users with defaults', async () => {
    const mockUsers = [{ id: 'u1', email: 'a@b.com' }];
    (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
    (prisma.user.count as jest.Mock).mockResolvedValue(1);

    const result = await service.getUsers({});

    expect(result).toEqual({ data: mockUsers, total: 1, page: 1, limit: 20 });
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 20, orderBy: { createdAt: 'desc' } }),
    );
  });

  it('getUsers applies search filter with OR clause', async () => {
    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.user.count as jest.Mock).mockResolvedValue(0);

    await service.getUsers({ search: 'alice' });

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { email: { contains: 'alice', mode: 'insensitive' } },
          ]),
        }),
      }),
    );
  });

  it('getUsers applies role filter', async () => {
    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.user.count as jest.Mock).mockResolvedValue(0);

    await service.getUsers({ role: 'admin' as any });

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ roles: { has: 'admin' } }),
      }),
    );
  });

  it('getUsers applies accountId filter', async () => {
    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.user.count as jest.Mock).mockResolvedValue(0);

    await service.getUsers({ accountId: 'acc-1' });

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ accountId: 'acc-1' }),
      }),
    );
  });

  // ──────────────────────────────────────────────
  //  getUser
  // ──────────────────────────────────────────────

  it('getUser returns user with account and projects', async () => {
    const mockUser = { id: 'u1', email: 'a@b.com', account: { id: 'acc-1', plan: 'spark', projects: [] } };
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    const result = await service.getUser('u1');

    expect(result).toEqual(mockUser);
    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'u1' } }),
    );
  });

  it('getUser throws NotFoundException for unknown id', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.getUser('unknown')).rejects.toThrow(NotFoundException);
  });

  // ──────────────────────────────────────────────
  //  updateUser
  // ──────────────────────────────────────────────

  it('updateUser updates firstName and lastName', async () => {
    const existing = { id: 'u1', email: 'a@b.com', roles: ['user'] };
    const updated = { ...existing, firstName: 'Alice', lastName: 'Smith' };
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(existing);
    (prisma.user.update as jest.Mock).mockResolvedValue(updated);

    const result = await service.updateUser('u1', { firstName: 'Alice', lastName: 'Smith' }, 'admin-id');

    expect(result).toEqual(updated);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: { firstName: 'Alice', lastName: 'Smith' },
      }),
    );
  });

  it('updateUser throws NotFoundException for unknown user', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.updateUser('unknown', { firstName: 'X' }, 'admin-id')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('updateUser throws ForbiddenException when admin removes own admin role', async () => {
    const existing = { id: 'admin-1', email: 'admin@test.com', roles: ['user', 'admin'] };
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(existing);

    await expect(
      service.updateUser('admin-1', { roles: ['user'] as any }, 'admin-1'),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('updateUser throws BadRequestException for duplicate email', async () => {
    const existing = { id: 'u1', email: 'old@test.com', roles: ['user'] };
    const conflicting = { id: 'u2', email: 'taken@test.com' };
    (prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce(conflicting);

    await expect(
      service.updateUser('u1', { email: 'taken@test.com' }, 'admin-id'),
    ).rejects.toThrow(BadRequestException);
  });

  it('updateUser allows updating roles for other users', async () => {
    const existing = { id: 'u2', email: 'other@test.com', roles: ['user'] };
    const updated = { ...existing, roles: ['user', 'admin'] };
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(existing);
    (prisma.user.update as jest.Mock).mockResolvedValue(updated);

    const result = await service.updateUser('u2', { roles: ['user', 'admin'] as any }, 'admin-1');

    expect(result).toEqual(updated);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { roles: ['user', 'admin'] },
      }),
    );
  });

  // ──────────────────────────────────────────────
  //  deleteUser
  // ──────────────────────────────────────────────

  it('deleteUser removes user successfully', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1' });
    (prisma.user.delete as jest.Mock).mockResolvedValue({ id: 'u1' });

    const result = await service.deleteUser('u1', 'admin-id');

    expect(result).toEqual({ success: true, message: 'User deleted' });
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
  });

  it('deleteUser throws ForbiddenException for self-delete', async () => {
    await expect(service.deleteUser('admin-1', 'admin-1')).rejects.toThrow(ForbiddenException);
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it('deleteUser throws NotFoundException for unknown user', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.deleteUser('unknown', 'admin-id')).rejects.toThrow(NotFoundException);
  });

  // ──────────────────────────────────────────────
  //  resetUserPassword
  // ──────────────────────────────────────────────

  it('resetUserPassword sets new hash', async () => {
    const existing = { id: 'u1', provider: 'local', passwordHash: 'old-hash' };
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(existing);
    (prisma.user.update as jest.Mock).mockResolvedValue(existing);

    const result = await service.resetUserPassword('u1', 'NewTemp123!');

    expect(result).toEqual({ success: true, message: 'Password has been reset' });
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: { passwordHash: expect.any(String) },
      }),
    );
  });

  it('resetUserPassword throws NotFoundException for unknown user', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.resetUserPassword('unknown', 'pass1234')).rejects.toThrow(NotFoundException);
  });

  it('resetUserPassword throws BadRequestException for Google-only user', async () => {
    const googleUser = { id: 'u1', provider: 'google', passwordHash: null };
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(googleUser);

    await expect(service.resetUserPassword('u1', 'pass1234')).rejects.toThrow(BadRequestException);
  });

  // ──────────────────────────────────────────────
  //  getAccountSubscribers
  // ──────────────────────────────────────────────

  it('getAccountSubscribers returns paginated subscribers', async () => {
    const mockAccount = { id: 'acc-1', projects: [{ id: 'p1' }, { id: 'p2' }] };
    const mockSubscribers = [{ id: 's1', email: 'sub@test.com' }];
    (prisma.account.findUnique as jest.Mock).mockResolvedValue(mockAccount);
    (prisma.subscriber.findMany as jest.Mock).mockResolvedValue(mockSubscribers);
    (prisma.subscriber.count as jest.Mock).mockResolvedValue(1);

    const result = await service.getAccountSubscribers('acc-1', {});

    expect(result).toEqual({ data: mockSubscribers, total: 1, page: 1, limit: 20 });
    expect(prisma.subscriber.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          projectId: { in: ['p1', 'p2'] },
        }),
      }),
    );
  });

  it('getAccountSubscribers throws NotFoundException for unknown account', async () => {
    (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.getAccountSubscribers('unknown', {})).rejects.toThrow(NotFoundException);
  });

  // ──────────────────────────────────────────────
  //  globalSearch (users added)
  // ──────────────────────────────────────────────

  it('globalSearch includes users in results', async () => {
    const mockUsers = [{ id: 'u1', email: 'alice@test.com' }];
    (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
    (prisma.project.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.subscriber.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.integration as any).findMany = jest.fn().mockResolvedValue([]);

    const result = await service.globalSearch('alice');

    expect(result.users).toEqual(mockUsers);
    expect(result).toHaveProperty('projects');
    expect(result).toHaveProperty('subscribers');
    expect(result).toHaveProperty('integrations');
  });
});
