import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotificationPreferenceService, DEFAULT_PREFERENCES } from './notification-preference.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

describe('NotificationPreferenceService', () => {
  let service: NotificationPreferenceService;
  let prisma: jest.Mocked<PrismaService>;

  const mockPreference = {
    id: 'pref-1',
    accountId: 'acc-1',
    event: 'waitlist.signup.created',
    channels: ['in_app', 'email'],
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrisma = {
      notificationPreference: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationPreferenceService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(NotificationPreferenceService);
    prisma = module.get(PrismaService);
  });

  describe('findAll', () => {
    it('should return defaults merged with saved preferences', async () => {
      (prisma.notificationPreference.findMany as jest.Mock).mockResolvedValue([mockPreference]);

      const result = await service.findAll('acc-1');

      expect(result).toHaveLength(DEFAULT_PREFERENCES.length);
      // The signup event should have the saved channels
      const signupPref = result.find((p) => p.event === 'waitlist.signup.created');
      expect(signupPref?.channels).toEqual(['in_app', 'email']);
      expect(signupPref?.id).toBe('pref-1');

      // Other events should have defaults
      const webhookPref = result.find((p) => p.event === 'integration.webhook.failed');
      expect(webhookPref?.channels).toEqual(['in_app', 'email']);
      expect(webhookPref?.id).toBeNull();
    });
  });

  describe('upsert', () => {
    it('should create or update preference', async () => {
      (prisma.notificationPreference.upsert as jest.Mock).mockResolvedValue(mockPreference);

      const result = await service.upsert('acc-1', {
        event: 'waitlist.signup.created',
        channels: ['in_app', 'email'],
        enabled: true,
      });

      expect(result).toEqual(mockPreference);
      expect(prisma.notificationPreference.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            accountId_event: {
              accountId: 'acc-1',
              event: 'waitlist.signup.created',
            },
          },
        }),
      );
    });
  });

  describe('update', () => {
    it('should update preference channels', async () => {
      (prisma.notificationPreference.findFirst as jest.Mock).mockResolvedValue(mockPreference);
      (prisma.notificationPreference.update as jest.Mock).mockResolvedValue({
        ...mockPreference,
        channels: ['email'],
      });

      const result = await service.update('acc-1', 'pref-1', { channels: ['email'] });

      expect(result.channels).toEqual(['email']);
    });

    it('should throw NotFoundException when preference not found', async () => {
      (prisma.notificationPreference.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.update('acc-1', 'pref-999', { enabled: false })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete preference', async () => {
      (prisma.notificationPreference.findFirst as jest.Mock).mockResolvedValue(mockPreference);
      (prisma.notificationPreference.delete as jest.Mock).mockResolvedValue(mockPreference);

      const result = await service.remove('acc-1', 'pref-1');

      expect(result).toEqual(mockPreference);
    });

    it('should throw NotFoundException when preference not found', async () => {
      (prisma.notificationPreference.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.remove('acc-1', 'pref-999')).rejects.toThrow(NotFoundException);
    });
  });
});
