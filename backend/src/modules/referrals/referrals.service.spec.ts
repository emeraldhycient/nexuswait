import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

describe('ReferralsService', () => {
  let service: ReferralsService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrisma = {
      project: {
        findUnique: jest.fn(),
      },
      subscriber: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(ReferralsService);
    prisma = module.get(PrismaService);
  });

  describe('getLeaderboard', () => {
    it('should return subscribers ordered by referral count', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        accountId: 'acc-1',
      });
      const mockLeaderboard = [
        { id: 's1', email: 'top@test.com', _count: { referred: 10 } },
        { id: 's2', email: 'second@test.com', _count: { referred: 5 } },
      ];
      (prisma.subscriber.findMany as jest.Mock).mockResolvedValue(
        mockLeaderboard,
      );

      const result = await service.getLeaderboard('p1', 'acc-1');

      expect(result).toEqual(mockLeaderboard);
      expect(prisma.subscriber.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: 'p1', referred: { some: {} } },
          include: { _count: { select: { referred: true } } },
          orderBy: { referred: { _count: 'desc' } },
          take: 20,
        }),
      );
    });

    it('should throw NotFoundException for wrong project', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.getLeaderboard('unknown', 'acc-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw when accountId does not match project', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        accountId: 'other-acc',
      });

      await expect(
        service.getLeaderboard('p1', 'acc-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should respect limit parameter', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        accountId: 'acc-1',
      });
      (prisma.subscriber.findMany as jest.Mock).mockResolvedValue([]);

      await service.getLeaderboard('p1', 'acc-1', 5);

      expect(prisma.subscriber.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        accountId: 'acc-1',
      });
      const mockSubscribers = [
        { id: 's1', email: 'a@test.com', referrer: null, _count: { referred: 0 } },
        { id: 's2', email: 'b@test.com', referrer: null, _count: { referred: 2 } },
      ];
      (prisma.subscriber.findMany as jest.Mock).mockResolvedValue(
        mockSubscribers,
      );

      const result = await service.findAll('p1', 'acc-1', 20);

      expect(result.data).toEqual(mockSubscribers);
      expect(result.nextCursor).toBeNull();
    });

    it('should return nextCursor when more data exists', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        accountId: 'acc-1',
      });
      // Return limit + 1 items to indicate more data
      const mockSubscribers = [
        { id: 's1', email: 'a@test.com' },
        { id: 's2', email: 'b@test.com' },
        { id: 's3', email: 'c@test.com' },
      ];
      (prisma.subscriber.findMany as jest.Mock).mockResolvedValue(
        mockSubscribers,
      );

      const result = await service.findAll('p1', 'acc-1', 2);

      expect(result.data).toHaveLength(2);
      expect(result.nextCursor).toBe('s2');
    });

    it('should return null nextCursor when no more data', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        accountId: 'acc-1',
      });
      const mockSubscribers = [
        { id: 's1', email: 'a@test.com' },
      ];
      (prisma.subscriber.findMany as jest.Mock).mockResolvedValue(
        mockSubscribers,
      );

      const result = await service.findAll('p1', 'acc-1', 20);

      expect(result.data).toHaveLength(1);
      expect(result.nextCursor).toBeNull();
    });
  });
});
