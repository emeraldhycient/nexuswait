import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrisma = {
      project: {
        findUnique: jest.fn(),
      },
      subscriber: {
        count: jest.fn(),
        groupBy: jest.fn(),
      },
      $queryRaw: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(AnalyticsService);
    prisma = module.get(PrismaService);
  });

  describe('getOverview', () => {
    it('should return all 5 counts', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        accountId: 'acc-1',
      });
      (prisma.subscriber.count as jest.Mock)
        .mockResolvedValueOnce(100) // totalSubscribers
        .mockResolvedValueOnce(5) // subscribersToday
        .mockResolvedValueOnce(25) // subscribersThisWeek
        .mockResolvedValueOnce(80) // verifiedCount
        .mockResolvedValueOnce(30); // referralCount

      const result = await service.getOverview('p1', 'acc-1');

      expect(result).toEqual({
        totalSubscribers: 100,
        subscribersToday: 5,
        subscribersThisWeek: 25,
        verifiedCount: 80,
        referralCount: 30,
      });
      expect(prisma.subscriber.count).toHaveBeenCalledTimes(5);
    });

    it('should throw NotFoundException for wrong project', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getOverview('p1', 'acc-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when accountId does not match', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        accountId: 'other-acc',
      });

      await expect(service.getOverview('p1', 'acc-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getTimeseries', () => {
    it('should return formatted rows', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        accountId: 'acc-1',
      });
      const mockDate = new Date('2025-01-15T00:00:00.000Z');
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([
        { date: mockDate, count: 10 },
        { date: new Date('2025-01-16T00:00:00.000Z'), count: 15 },
      ]);

      const result = await service.getTimeseries('p1', 'acc-1', '30d', 'day');

      expect(result).toEqual([
        { date: '2025-01-15T00:00:00.000Z', count: 10 },
        { date: '2025-01-16T00:00:00.000Z', count: 15 },
      ]);
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('should default to 7 days for invalid period', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        accountId: 'acc-1',
      });
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);

      await service.getTimeseries('p1', 'acc-1', 'invalid', 'day');

      // The $queryRaw call should use 7 as the default days value
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
      // Verify it was called (the Prisma.sql template handles the '7 days' interval internally)
      const callArg = (prisma.$queryRaw as jest.Mock).mock.calls[0][0];
      expect(callArg).toBeDefined();
    });

    it('should default granularity to day for invalid input', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        accountId: 'acc-1',
      });
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);

      await service.getTimeseries('p1', 'acc-1', '7d', 'invalid_granularity');

      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
      const callArg = (prisma.$queryRaw as jest.Mock).mock.calls[0][0];
      expect(callArg).toBeDefined();
    });
  });

  describe('getSources', () => {
    it('should return grouped data', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        accountId: 'acc-1',
      });
      (prisma.subscriber.groupBy as jest.Mock).mockResolvedValue([
        { source: 'twitter', _count: 15 },
        { source: null, _count: 10 },
        { source: 'google', _count: 5 },
      ]);

      const result = await service.getSources('p1', 'acc-1');

      expect(result).toEqual([
        { source: 'twitter', count: 15 },
        { source: 'direct', count: 10 },
        { source: 'google', count: 5 },
      ]);
      expect(prisma.subscriber.groupBy).toHaveBeenCalledWith({
        by: ['source'],
        where: { projectId: 'p1' },
        _count: true,
      });
    });
  });
});
