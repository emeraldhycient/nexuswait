import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PolarSyncService } from './polar-sync.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PolarSyncService', () => {
  let service: PolarSyncService;
  let prisma: jest.Mocked<PrismaService>;
  let config: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockPrisma = {
      planConfig: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const mockConfig = {
      get: jest.fn((key: string) => {
        if (key === 'POLAR_ACCESS_TOKEN') return 'test-token';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PolarSyncService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get(PolarSyncService);
    prisma = module.get(PrismaService);
    config = module.get(ConfigService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── fetchProducts ──────────────────────────────────

  describe('fetchProducts', () => {
    it('should fetch and return products from Polar API', async () => {
      const products = [
        { id: 'prod-1', name: 'Pulse', is_archived: false },
        { id: 'prod-2', name: 'Nexus', is_archived: false },
      ];
      mockedAxios.get.mockResolvedValue({ data: { items: products } });

      const result = await service.fetchProducts('test-token');

      expect(result).toEqual(products);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.polar.sh/v1/products',
        expect.objectContaining({
          params: { page: 1, limit: 100, is_archived: false },
          headers: { Authorization: 'Bearer test-token' },
        }),
      );
    });

    it('should handle paginated results', async () => {
      const page1 = Array.from({ length: 100 }, (_, i) => ({
        id: `prod-${i}`,
        name: `Product-${i}`,
        is_archived: false,
      }));
      const page2 = [{ id: 'prod-100', name: 'Pulse', is_archived: false }];

      mockedAxios.get
        .mockResolvedValueOnce({ data: { items: page1 } })
        .mockResolvedValueOnce({ data: { items: page2 } });

      const result = await service.fetchProducts('test-token');

      expect(result).toHaveLength(101);
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });

    it('should handle empty response', async () => {
      mockedAxios.get.mockResolvedValue({ data: { items: [] } });

      const result = await service.fetchProducts('test-token');

      expect(result).toEqual([]);
    });
  });

  // ─── syncProducts ──────────────────────────────────

  describe('syncProducts', () => {
    it('should skip sync when no POLAR_ACCESS_TOKEN', async () => {
      (config.get as jest.Mock).mockReturnValue(undefined);

      const result = await service.syncProducts();

      expect(result).toEqual({ synced: 0, skipped: 0 });
      expect(mockedAxios.get).not.toHaveBeenCalled();
    });

    it('should map Polar products to plan configs by name', async () => {
      const polarProducts = [
        { id: 'polar-pulse-m', name: 'Pulse', is_archived: false },
        { id: 'polar-pulse-y', name: 'Pulse_annual', is_archived: false },
        { id: 'polar-nexus-m', name: 'Nexus', is_archived: false },
        { id: 'polar-nexus-y', name: 'Nexus_annual', is_archived: false },
        { id: 'polar-spark', name: 'Spark', is_archived: false },
      ];
      mockedAxios.get.mockResolvedValue({ data: { items: polarProducts } });

      (prisma.planConfig.findUnique as jest.Mock).mockImplementation(({ where }) => {
        if (where.tier === 'pulse') return { tier: 'pulse' };
        if (where.tier === 'nexus') return { tier: 'nexus' };
        return null;
      });
      (prisma.planConfig.update as jest.Mock).mockResolvedValue({});

      const result = await service.syncProducts();

      // 2 tiers synced (pulse + nexus), 1 skipped (Spark is unmapped)
      expect(result.synced).toBe(2);

      // Pulse should get both monthly and yearly IDs
      expect(prisma.planConfig.update).toHaveBeenCalledWith({
        where: { tier: 'pulse' },
        data: {
          polarProductIdMonthly: 'polar-pulse-m',
          polarProductIdYearly: 'polar-pulse-y',
        },
      });

      // Nexus should get both monthly and yearly IDs
      expect(prisma.planConfig.update).toHaveBeenCalledWith({
        where: { tier: 'nexus' },
        data: {
          polarProductIdMonthly: 'polar-nexus-m',
          polarProductIdYearly: 'polar-nexus-y',
        },
      });
    });

    it('should skip archived products', async () => {
      const polarProducts = [
        { id: 'polar-old', name: 'Pulse', is_archived: true },
        { id: 'polar-new', name: 'Nexus', is_archived: false },
      ];
      mockedAxios.get.mockResolvedValue({ data: { items: polarProducts } });
      (prisma.planConfig.findUnique as jest.Mock).mockResolvedValue({ tier: 'nexus' });
      (prisma.planConfig.update as jest.Mock).mockResolvedValue({});

      const result = await service.syncProducts();

      expect(result.synced).toBe(1);
      expect(result.skipped).toBeGreaterThanOrEqual(1);
      // Should only update nexus, not pulse (archived)
      expect(prisma.planConfig.update).toHaveBeenCalledTimes(1);
      expect(prisma.planConfig.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tier: 'nexus' },
        }),
      );
    });

    it('should skip when PlanConfig tier not found in DB', async () => {
      const polarProducts = [
        { id: 'polar-pulse-m', name: 'Pulse', is_archived: false },
      ];
      mockedAxios.get.mockResolvedValue({ data: { items: polarProducts } });
      (prisma.planConfig.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.syncProducts();

      expect(result.synced).toBe(0);
      expect(result.skipped).toBeGreaterThanOrEqual(1);
      expect(prisma.planConfig.update).not.toHaveBeenCalled();
    });

    it('should handle Polar API failure gracefully', async () => {
      mockedAxios.get.mockRejectedValue(new Error('401 Unauthorized'));

      const result = await service.syncProducts();

      expect(result).toEqual({ synced: 0, skipped: 0 });
    });

    it('should handle case-insensitive product names', async () => {
      const polarProducts = [
        { id: 'polar-p', name: 'PULSE', is_archived: false },
      ];
      mockedAxios.get.mockResolvedValue({ data: { items: polarProducts } });
      (prisma.planConfig.findUnique as jest.Mock).mockResolvedValue({ tier: 'pulse' });
      (prisma.planConfig.update as jest.Mock).mockResolvedValue({});

      const result = await service.syncProducts();

      expect(result.synced).toBe(1);
    });
  });
});
