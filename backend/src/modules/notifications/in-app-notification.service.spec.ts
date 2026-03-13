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
});
