import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InAppNotificationService } from './in-app-notification.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

describe('InAppNotificationService', () => {
  let service: InAppNotificationService;
  let prisma: jest.Mocked<PrismaService>;

  const mockNotification = {
    id: 'notif-1',
    accountId: 'acc-1',
    title: 'New Signup',
    body: 'user@test.com joined the Test Project waitlist.',
    type: 'success',
    actionUrl: '/dashboard/project/proj-1',
    readAt: null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrisma = {
      inAppNotification: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      project: {
        findUnique: jest.fn(),
      },
      notificationPreference: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InAppNotificationService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(InAppNotificationService);
    prisma = module.get(PrismaService);
  });

  describe('create', () => {
    it('should create an in-app notification', async () => {
      (prisma.inAppNotification.create as jest.Mock).mockResolvedValue(mockNotification);

      const result = await service.create({
        accountId: 'acc-1',
        title: 'New Signup',
        body: 'user@test.com joined the Test Project waitlist.',
        type: 'success',
        actionUrl: '/dashboard/project/proj-1',
      });

      expect(result).toEqual(mockNotification);
      expect(prisma.inAppNotification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          accountId: 'acc-1',
          title: 'New Signup',
          type: 'success',
        }),
      });
    });
  });

  describe('findAll', () => {
    it('should return notifications for account', async () => {
      (prisma.inAppNotification.findMany as jest.Mock).mockResolvedValue([mockNotification]);

      const result = await service.findAll('acc-1');

      expect(result).toEqual([mockNotification]);
      expect(prisma.inAppNotification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { accountId: 'acc-1' },
          orderBy: { createdAt: 'desc' },
          take: 30,
          skip: 0,
        }),
      );
    });

    it('should filter unread only', async () => {
      (prisma.inAppNotification.findMany as jest.Mock).mockResolvedValue([mockNotification]);

      await service.findAll('acc-1', { unreadOnly: true });

      expect(prisma.inAppNotification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { accountId: 'acc-1', readAt: null },
        }),
      );
    });
  });

  describe('unreadCount', () => {
    it('should return count of unread notifications', async () => {
      (prisma.inAppNotification.count as jest.Mock).mockResolvedValue(5);

      const result = await service.unreadCount('acc-1');

      expect(result).toBe(5);
      expect(prisma.inAppNotification.count).toHaveBeenCalledWith({
        where: { accountId: 'acc-1', readAt: null },
      });
    });
  });

  describe('markRead', () => {
    it('should mark a notification as read', async () => {
      (prisma.inAppNotification.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      await service.markRead('acc-1', 'notif-1');

      expect(prisma.inAppNotification.updateMany).toHaveBeenCalledWith({
        where: { id: 'notif-1', accountId: 'acc-1' },
        data: expect.objectContaining({ readAt: expect.any(Date) }),
      });
    });
  });

  describe('markAllRead', () => {
    it('should mark all notifications as read', async () => {
      (prisma.inAppNotification.updateMany as jest.Mock).mockResolvedValue({ count: 3 });

      await service.markAllRead('acc-1');

      expect(prisma.inAppNotification.updateMany).toHaveBeenCalledWith({
        where: { accountId: 'acc-1', readAt: null },
        data: expect.objectContaining({ readAt: expect.any(Date) }),
      });
    });
  });

  describe('remove', () => {
    it('should delete a notification', async () => {
      (prisma.inAppNotification.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      await service.remove('acc-1', 'notif-1');

      expect(prisma.inAppNotification.deleteMany).toHaveBeenCalledWith({
        where: { id: 'notif-1', accountId: 'acc-1' },
      });
    });
  });

  describe('onSignup', () => {
    it('should create in-app notification on signup event', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        accountId: 'acc-1',
        name: 'Test Project',
      });
      (prisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.inAppNotification.create as jest.Mock).mockResolvedValue(mockNotification);

      await service.onSignup({
        projectId: 'proj-1',
        subscriber: { email: 'user@test.com' },
      });

      expect(prisma.inAppNotification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          accountId: 'acc-1',
          title: 'New Signup',
          type: 'success',
        }),
      });
    });

    it('should skip if in_app channel disabled in preferences', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        accountId: 'acc-1',
        name: 'Test Project',
      });
      (prisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue({
        enabled: true,
        channels: ['email'], // no 'in_app'
      });

      await service.onSignup({
        projectId: 'proj-1',
        subscriber: { email: 'user@test.com' },
      });

      expect(prisma.inAppNotification.create).not.toHaveBeenCalled();
    });
  });

  /* ─── New event listener tests ────────────────────── */

  const setupNotifyHelper = () => {
    (prisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.inAppNotification.create as jest.Mock).mockResolvedValue(mockNotification);
  };

  describe('onProjectCreated', () => {
    it('should create in-app notification', async () => {
      setupNotifyHelper();

      await service.onProjectCreated({
        accountId: 'acc-1',
        project: { id: 'proj-1', name: 'New Project', slug: 'new-project' },
      });

      expect(prisma.inAppNotification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          accountId: 'acc-1',
          title: 'Project Created',
          type: 'success',
        }),
      });
    });
  });

  describe('onProjectArchived', () => {
    it('should create in-app notification', async () => {
      setupNotifyHelper();

      await service.onProjectArchived({
        accountId: 'acc-1',
        project: { id: 'proj-1', name: 'Old Project' },
      });

      expect(prisma.inAppNotification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          accountId: 'acc-1',
          title: 'Project Archived',
          type: 'warning',
        }),
      });
    });
  });

  describe('onIntegrationCreated', () => {
    it('should create in-app notification', async () => {
      setupNotifyHelper();

      await service.onIntegrationCreated({
        accountId: 'acc-1',
        projectId: 'proj-1',
        integration: { id: 'int-1', type: 'webhook', displayName: 'My Webhook' },
      });

      expect(prisma.inAppNotification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          accountId: 'acc-1',
          title: 'Integration Connected',
          type: 'success',
        }),
      });
    });
  });

  describe('onSubscriptionUpgraded', () => {
    it('should create in-app notification', async () => {
      setupNotifyHelper();

      await service.onSubscriptionUpgraded({
        accountId: 'acc-1',
        plan: 'pulse',
        previousPlan: 'spark',
      });

      expect(prisma.inAppNotification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          accountId: 'acc-1',
          title: 'Plan Upgraded',
          type: 'success',
        }),
      });
    });
  });

  describe('onSubscriptionCancelled', () => {
    it('should create in-app notification', async () => {
      setupNotifyHelper();

      await service.onSubscriptionCancelled({ accountId: 'acc-1' });

      expect(prisma.inAppNotification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          accountId: 'acc-1',
          title: 'Subscription Cancelled',
          type: 'warning',
        }),
      });
    });
  });

  describe('onSubscriberMilestone', () => {
    it('should create in-app notification', async () => {
      setupNotifyHelper();

      await service.onSubscriberMilestone({
        accountId: 'acc-1',
        projectId: 'proj-1',
        projectName: 'Test Project',
        count: 1000,
      });

      expect(prisma.inAppNotification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          accountId: 'acc-1',
          title: 'Milestone Reached!',
          type: 'success',
        }),
      });
    });
  });

  describe('onApiKeyCreated', () => {
    it('should create in-app notification', async () => {
      setupNotifyHelper();

      await service.onApiKeyCreated({
        accountId: 'acc-1',
        keyPrefix: 'nw_sk_live_XXXX',
        type: 'secret',
      });

      expect(prisma.inAppNotification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          accountId: 'acc-1',
          title: 'API Key Created',
          type: 'info',
        }),
      });
    });
  });

  describe('onApiKeyRevoked', () => {
    it('should create in-app notification', async () => {
      setupNotifyHelper();

      await service.onApiKeyRevoked({
        accountId: 'acc-1',
        keyPrefix: 'nw_sk_live_XXXX',
      });

      expect(prisma.inAppNotification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          accountId: 'acc-1',
          title: 'API Key Revoked',
          type: 'warning',
        }),
      });
    });
  });

  describe('onHostedPagePublished', () => {
    it('should create in-app notification', async () => {
      setupNotifyHelper();

      await service.onHostedPagePublished({
        accountId: 'acc-1',
        projectId: 'proj-1',
        page: { slug: 'my-page', title: 'My Page' },
      });

      expect(prisma.inAppNotification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          accountId: 'acc-1',
          title: 'Page Published',
          type: 'success',
        }),
      });
    });
  });

  describe('notifyIfEnabled (preference gating)', () => {
    it('should skip when preference is disabled', async () => {
      (prisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue({
        enabled: false,
        channels: ['in_app', 'email'],
      });

      await service.onProjectCreated({
        accountId: 'acc-1',
        project: { id: 'proj-1', name: 'P', slug: 'p' },
      });

      expect(prisma.inAppNotification.create).not.toHaveBeenCalled();
    });
  });
});
