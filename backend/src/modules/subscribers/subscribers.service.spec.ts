import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '../../generated/prisma/client/client';
import { SubscribersService } from './subscribers.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { PlanEnforcementService } from '../plan-config/plan-enforcement.service';

describe('SubscribersService', () => {
  let service: SubscribersService;
  let prisma: jest.Mocked<PrismaService>;
  let eventEmitter: { emit: jest.Mock };

  beforeEach(async () => {
    const mockPrisma = {
      project: {
        findUnique: jest.fn(),
      },
      subscriber: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    eventEmitter = { emit: jest.fn() };

    const mockPlanEnforcement = {
      checkProjectLimit: jest.fn().mockResolvedValue(undefined),
      checkSubscriberLimit: jest.fn().mockResolvedValue(undefined),
      checkIntegrationLimit: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscribersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: eventEmitter },
        { provide: PlanEnforcementService, useValue: mockPlanEnforcement },
      ],
    }).compile();

    service = module.get(SubscribersService);
    prisma = module.get(PrismaService);
  });

  describe('create', () => {
    it('should create subscriber with referral code', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        accountId: 'acc-1',
      });
      // findUnique for referral code uniqueness check - return null (code is unique)
      (prisma.subscriber.findUnique as jest.Mock).mockResolvedValue(null);
      const mockSubscriber = {
        id: 's1',
        email: 'new@test.com',
        projectId: 'p1',
        referralCode: 'ABCD1234',
        referrerId: null,
        source: 'direct',
      };
      (prisma.subscriber.create as jest.Mock).mockResolvedValue(
        mockSubscriber,
      );

      const result = await service.create('p1', {
        email: 'new@test.com',
      });

      expect(result).toEqual(mockSubscriber);
      expect(prisma.subscriber.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            projectId: 'p1',
            email: 'new@test.com',
            referrerId: null,
            source: 'direct',
          }),
        }),
      );
    });

    it('should resolve referrer from ref code', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        accountId: 'acc-1',
      });
      // findFirst for referrer lookup
      (prisma.subscriber.findFirst as jest.Mock).mockResolvedValue({
        id: 'referrer-1',
        referralCode: 'REF123',
      });
      // findUnique for referral code uniqueness - return null (code is unique)
      (prisma.subscriber.findUnique as jest.Mock).mockResolvedValue(null);
      const mockSubscriber = {
        id: 's1',
        email: 'referred@test.com',
        projectId: 'p1',
        referralCode: 'NEWCODE1',
        referrerId: 'referrer-1',
        source: 'direct',
      };
      (prisma.subscriber.create as jest.Mock).mockResolvedValue(
        mockSubscriber,
      );

      const result = await service.create(
        'p1',
        { email: 'referred@test.com' },
        'REF123',
      );

      expect(result.referrerId).toBe('referrer-1');
      expect(prisma.subscriber.findFirst).toHaveBeenCalledWith({
        where: { projectId: 'p1', referralCode: 'REF123' },
      });
    });

    it('should emit waitlist.signup.created event', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        accountId: 'acc-1',
      });
      (prisma.subscriber.findUnique as jest.Mock).mockResolvedValue(null);
      const mockSubscriber = {
        id: 's1',
        email: 'event@test.com',
        projectId: 'p1',
        referralCode: 'CODE1',
      };
      (prisma.subscriber.create as jest.Mock).mockResolvedValue(
        mockSubscriber,
      );

      await service.create('p1', { email: 'event@test.com' });

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'waitlist.signup.created',
        { projectId: 'p1', subscriber: mockSubscriber },
      );
    });

    it('should throw NotFoundException when project not found', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.create('unknown', { email: 'test@test.com' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException for duplicate email in same project', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        accountId: 'acc-1',
      });
      (prisma.subscriber.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.subscriber.create as jest.Mock).mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError(
          'Unique constraint failed on the fields: (`projectId`,`email`)',
          { code: 'P2002', clientVersion: '6.0.0' },
        ),
      );

      await expect(
        service.create('p1', { email: 'duplicate@test.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should re-throw non-P2002 Prisma errors', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        accountId: 'acc-1',
      });
      (prisma.subscriber.findUnique as jest.Mock).mockResolvedValue(null);
      const otherError = new Error('Some unexpected error');
      (prisma.subscriber.create as jest.Mock).mockRejectedValue(otherError);

      await expect(
        service.create('p1', { email: 'other@test.com' }),
      ).rejects.toThrow('Some unexpected error');
    });
  });

  describe('findAll', () => {
    it('should return paginated results with nextCursor', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        accountId: 'acc-1',
      });
      // Return limit + 1 items to indicate more data
      const mockSubscribers = [
        { id: 's1', email: 'a@test.com', referrer: null },
        { id: 's2', email: 'b@test.com', referrer: null },
        { id: 's3', email: 'c@test.com', referrer: null },
      ];
      (prisma.subscriber.findMany as jest.Mock).mockResolvedValue(
        mockSubscribers,
      );

      const result = await service.findAll('p1', 'acc-1', { limit: 2 });

      expect(result.data).toHaveLength(2);
      expect(result.nextCursor).toBe('s2');
    });

    it('should return null nextCursor when no more data', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        accountId: 'acc-1',
      });
      const mockSubscribers = [
        { id: 's1', email: 'a@test.com', referrer: null },
      ];
      (prisma.subscriber.findMany as jest.Mock).mockResolvedValue(
        mockSubscribers,
      );

      const result = await service.findAll('p1', 'acc-1', { limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.nextCursor).toBeNull();
    });

    it('should throw NotFoundException for wrong project', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.findAll('unknown', 'acc-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should apply search filter on email and name', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        accountId: 'acc-1',
      });
      (prisma.subscriber.findMany as jest.Mock).mockResolvedValue([]);

      await service.findAll('p1', 'acc-1', { search: 'john' });

      expect(prisma.subscriber.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            projectId: 'p1',
            OR: [
              { email: { contains: 'john', mode: 'insensitive' } },
              { name: { contains: 'john', mode: 'insensitive' } },
            ],
          },
        }),
      );
    });

    it('should apply source filter', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        accountId: 'acc-1',
      });
      (prisma.subscriber.findMany as jest.Mock).mockResolvedValue([]);

      await service.findAll('p1', 'acc-1', { source: 'twitter' });

      expect(prisma.subscriber.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            projectId: 'p1',
            source: 'twitter',
          },
        }),
      );
    });

    it('should combine search and source filters', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        accountId: 'acc-1',
      });
      (prisma.subscriber.findMany as jest.Mock).mockResolvedValue([]);

      await service.findAll('p1', 'acc-1', { search: 'test', source: 'api' });

      expect(prisma.subscriber.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            projectId: 'p1',
            OR: [
              { email: { contains: 'test', mode: 'insensitive' } },
              { name: { contains: 'test', mode: 'insensitive' } },
            ],
            source: 'api',
          },
        }),
      );
    });

    it('should sort by oldest (createdAt asc)', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        accountId: 'acc-1',
      });
      (prisma.subscriber.findMany as jest.Mock).mockResolvedValue([]);

      await service.findAll('p1', 'acc-1', { sort: 'oldest' });

      expect(prisma.subscriber.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'asc' },
        }),
      );
    });

    it('should sort by name (name asc)', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        accountId: 'acc-1',
      });
      (prisma.subscriber.findMany as jest.Mock).mockResolvedValue([]);

      await service.findAll('p1', 'acc-1', { sort: 'name' });

      expect(prisma.subscriber.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        }),
      );
    });

    it('should default sort to newest (createdAt desc)', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        accountId: 'acc-1',
      });
      (prisma.subscriber.findMany as jest.Mock).mockResolvedValue([]);

      await service.findAll('p1', 'acc-1');

      expect(prisma.subscriber.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should use createdAt desc for referrals sort', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        accountId: 'acc-1',
      });
      (prisma.subscriber.findMany as jest.Mock).mockResolvedValue([]);

      await service.findAll('p1', 'acc-1', { sort: 'referrals' });

      expect(prisma.subscriber.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });

  describe('exportAll', () => {
    it('should return all subscribers without pagination', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        accountId: 'acc-1',
      });
      const mockSubscribers = [
        { id: 's1', email: 'a@test.com' },
        { id: 's2', email: 'b@test.com' },
      ];
      (prisma.subscriber.findMany as jest.Mock).mockResolvedValue(mockSubscribers);

      const result = await service.exportAll('p1', 'acc-1');

      expect(result).toEqual(mockSubscribers);
      // Should not have take/cursor (no pagination)
      expect(prisma.subscriber.findMany).toHaveBeenCalledWith(
        expect.not.objectContaining({ take: expect.anything() }),
      );
    });

    it('should apply search filter in exportAll', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        accountId: 'acc-1',
      });
      (prisma.subscriber.findMany as jest.Mock).mockResolvedValue([]);

      await service.exportAll('p1', 'acc-1', { search: 'alice' });

      expect(prisma.subscriber.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            projectId: 'p1',
            OR: [
              { email: { contains: 'alice', mode: 'insensitive' } },
              { name: { contains: 'alice', mode: 'insensitive' } },
            ],
          },
        }),
      );
    });

    it('should apply source filter in exportAll', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        accountId: 'acc-1',
      });
      (prisma.subscriber.findMany as jest.Mock).mockResolvedValue([]);

      await service.exportAll('p1', 'acc-1', { source: 'landing-page' });

      expect(prisma.subscriber.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            projectId: 'p1',
            source: 'landing-page',
          },
        }),
      );
    });

    it('should throw NotFoundException for wrong project in exportAll', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.exportAll('unknown', 'acc-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when account does not own project in exportAll', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        accountId: 'other-acc',
      });

      await expect(
        service.exportAll('p1', 'acc-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getFormConfig', () => {
    it('should return custom fields for an existing project', async () => {
      const mockFields = [
        { id: 'f1', label: 'Company', fieldKey: 'company', type: 'text', required: true },
        { id: 'f2', label: 'Role', fieldKey: 'role', type: 'select', required: false, options: ['Developer', 'Designer'] },
      ];
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        customFields: mockFields,
      });

      const result = await service.getFormConfig('p1');

      expect(result).toEqual({ customFields: mockFields });
      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: 'p1' },
        select: { id: true, customFields: true },
      });
    });

    it('should return empty array when project has no custom fields', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        customFields: null,
      });

      const result = await service.getFormConfig('p1');

      expect(result).toEqual({ customFields: [] });
    });

    it('should throw NotFoundException for missing project', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getFormConfig('unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCount', () => {
    it('should return subscriber count', async () => {
      (prisma.subscriber.count as jest.Mock).mockResolvedValue(42);

      const result = await service.getCount('p1');

      expect(result).toBe(42);
      expect(prisma.subscriber.count).toHaveBeenCalledWith({
        where: { projectId: 'p1' },
      });
    });
  });

  describe('findOne', () => {
    it('should return subscriber with referrer', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        accountId: 'acc-1',
      });
      const mockSubscriber = {
        id: 's1',
        email: 'found@test.com',
        projectId: 'p1',
        referrer: { id: 'ref-1', email: 'referrer@test.com', referralCode: 'REF1' },
        _count: { referred: 3 },
      };
      (prisma.subscriber.findFirst as jest.Mock).mockResolvedValue(
        mockSubscriber,
      );

      const result = await service.findOne('p1', 's1', 'acc-1');

      expect(result).toEqual(mockSubscriber);
      expect(result.referrer).toBeDefined();
      expect(result._count.referred).toBe(3);
    });

    it('should throw NotFoundException when subscriber not found', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        accountId: 'acc-1',
      });
      (prisma.subscriber.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.findOne('p1', 'unknown-sub', 'acc-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when project ownership fails', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        accountId: 'other-acc',
      });

      await expect(
        service.findOne('p1', 's1', 'acc-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should modify subscriber', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        accountId: 'acc-1',
      });
      (prisma.subscriber.findFirst as jest.Mock).mockResolvedValue({
        id: 's1',
        email: 'old@test.com',
        projectId: 'p1',
      });
      (prisma.subscriber.update as jest.Mock).mockResolvedValue({
        id: 's1',
        email: 'updated@test.com',
        projectId: 'p1',
      });

      const result = await service.update('p1', 's1', 'acc-1', {
        email: 'updated@test.com',
      });

      expect(result.email).toBe('updated@test.com');
      expect(prisma.subscriber.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 's1' },
          data: expect.objectContaining({ email: 'updated@test.com' }),
        }),
      );
    });

    it('should throw NotFoundException when subscriber not found for update', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        accountId: 'acc-1',
      });
      (prisma.subscriber.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.update('p1', 'unknown', 'acc-1', { email: 'x@test.com' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete subscriber', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        accountId: 'acc-1',
      });
      (prisma.subscriber.findFirst as jest.Mock).mockResolvedValue({
        id: 's1',
        email: 'delete@test.com',
        projectId: 'p1',
      });
      (prisma.subscriber.delete as jest.Mock).mockResolvedValue({
        id: 's1',
      });

      const result = await service.remove('p1', 's1', 'acc-1');

      expect(result).toEqual({ deleted: true });
      expect(prisma.subscriber.delete).toHaveBeenCalledWith({
        where: { id: 's1' },
      });
    });

    it('should throw NotFoundException when subscriber not found for delete', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        accountId: 'acc-1',
      });
      (prisma.subscriber.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.remove('p1', 'unknown', 'acc-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
