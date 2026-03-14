import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailNotificationService } from './email-notification.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { NotificationsService } from './notifications.service';

describe('EmailNotificationService', () => {
  let service: EmailNotificationService;
  let prisma: jest.Mocked<PrismaService>;
  let notifications: jest.Mocked<NotificationsService>;

  beforeEach(async () => {
    const mockPrisma = {
      user: { findFirst: jest.fn() },
      project: { findUnique: jest.fn() },
      notificationTemplate: { findFirst: jest.fn() },
      notificationPreference: { findUnique: jest.fn() },
    };

    const mockNotifications = {
      enqueue: jest.fn().mockResolvedValue({ id: 'notif-1' }),
    };

    const mockConfig = {
      get: jest.fn((key: string) => {
        if (key === 'FRONTEND_URL') return 'http://localhost:5173';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailNotificationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get(EmailNotificationService);
    prisma = module.get(PrismaService);
    notifications = module.get(NotificationsService);
  });

  const setupEnqueue = () => {
    (prisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.findFirst as jest.Mock).mockResolvedValue({ email: 'owner@test.com' });
    (prisma.notificationTemplate.findFirst as jest.Mock).mockResolvedValue({ id: 'tpl-1' });
  };

  describe('onSignup', () => {
    it('should enqueue email on signup event', async () => {
      setupEnqueue();
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        accountId: 'acc-1',
        name: 'Test Project',
      });

      await service.onSignup({
        projectId: 'proj-1',
        subscriber: { email: 'user@test.com', name: 'John' },
      });

      expect(notifications.enqueue).toHaveBeenCalledWith(
        'tpl-1',
        'owner@test.com',
        expect.objectContaining({
          projectName: 'Test Project',
          subscriberLabel: 'John',
        }),
      );
    });

    it('should skip if project not found', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

      await service.onSignup({
        projectId: 'proj-1',
        subscriber: { email: 'user@test.com' },
      });

      expect(notifications.enqueue).not.toHaveBeenCalled();
    });
  });

  describe('onProjectCreated', () => {
    it('should enqueue email', async () => {
      setupEnqueue();

      await service.onProjectCreated({
        accountId: 'acc-1',
        project: { id: 'proj-1', name: 'New Project', slug: 'new-project' },
      });

      expect(notifications.enqueue).toHaveBeenCalledWith(
        'tpl-1',
        'owner@test.com',
        expect.objectContaining({ projectName: 'New Project' }),
      );
    });
  });

  describe('onSubscriptionUpgraded', () => {
    it('should enqueue email with plan info', async () => {
      setupEnqueue();

      await service.onSubscriptionUpgraded({
        accountId: 'acc-1',
        plan: 'pulse',
        previousPlan: 'spark',
      });

      expect(notifications.enqueue).toHaveBeenCalledWith(
        'tpl-1',
        'owner@test.com',
        expect.objectContaining({ planName: 'pulse', previousPlan: 'spark' }),
      );
    });
  });

  describe('onSubscriberMilestone', () => {
    it('should enqueue email with count', async () => {
      setupEnqueue();

      await service.onSubscriberMilestone({
        accountId: 'acc-1',
        projectId: 'proj-1',
        projectName: 'Test',
        count: 1000,
      });

      expect(notifications.enqueue).toHaveBeenCalledWith(
        'tpl-1',
        'owner@test.com',
        expect.objectContaining({ projectName: 'Test', count: '1000' }),
      );
    });
  });

  describe('preference gating', () => {
    it('should skip when email channel disabled', async () => {
      (prisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue({
        enabled: true,
        channels: ['in_app'], // no 'email'
      });

      await service.onProjectCreated({
        accountId: 'acc-1',
        project: { id: 'proj-1', name: 'P', slug: 'p' },
      });

      expect(notifications.enqueue).not.toHaveBeenCalled();
    });

    it('should skip when preference is disabled', async () => {
      (prisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue({
        enabled: false,
        channels: ['email', 'in_app'],
      });

      await service.onProjectCreated({
        accountId: 'acc-1',
        project: { id: 'proj-1', name: 'P', slug: 'p' },
      });

      expect(notifications.enqueue).not.toHaveBeenCalled();
    });
  });

  describe('missing dependencies', () => {
    it('should skip when no user email found', async () => {
      (prisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      await service.onProjectCreated({
        accountId: 'acc-1',
        project: { id: 'proj-1', name: 'P', slug: 'p' },
      });

      expect(notifications.enqueue).not.toHaveBeenCalled();
    });

    it('should skip when no template found', async () => {
      (prisma.notificationPreference.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({ email: 'owner@test.com' });
      (prisma.notificationTemplate.findFirst as jest.Mock).mockResolvedValue(null);

      await service.onProjectCreated({
        accountId: 'acc-1',
        project: { id: 'proj-1', name: 'P', slug: 'p' },
      });

      expect(notifications.enqueue).not.toHaveBeenCalled();
    });
  });
});
