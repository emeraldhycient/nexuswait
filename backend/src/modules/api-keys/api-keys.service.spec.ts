import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApiKeyType } from '../../generated/prisma/client/enums';
import { ApiKeysService } from './api-keys.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

describe('ApiKeysService', () => {
  let service: ApiKeysService;
  let prisma: jest.Mocked<PrismaService>;
  let eventEmitter: { emit: jest.Mock };

  beforeEach(async () => {
    const mockPrisma = {
      apiKey: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn(),
      },
    };

    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeysService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get(ApiKeysService);
    prisma = module.get(PrismaService);
  });

  describe('generate()', () => {
    it('should return key with correct prefix for secret type', async () => {
      (prisma.apiKey.create as jest.Mock).mockResolvedValue({
        id: 'key-1',
        keyHash: 'somehash',
        prefix: 'nw_sk_live_XXXX',
        type: ApiKeyType.secret,
        createdAt: new Date('2025-01-01'),
      });

      const result = await service.generate('acc-1', {
        type: ApiKeyType.secret,
      });

      expect(result.key).toMatch(/^nw_sk_live_/);
      expect(result.prefix).toMatch(/^nw_sk_live_/);
      expect(result.type).toBe(ApiKeyType.secret);
    });

    it('should return key with correct prefix for publishable type', async () => {
      (prisma.apiKey.create as jest.Mock).mockResolvedValue({
        id: 'key-2',
        keyHash: 'somehash',
        prefix: 'nw_pk_live_XXXX',
        type: ApiKeyType.publishable,
        createdAt: new Date('2025-01-01'),
      });

      const result = await service.generate('acc-1', {
        type: ApiKeyType.publishable,
      });

      expect(result.key).toMatch(/^nw_pk_live_/);
      expect(result.prefix).toMatch(/^nw_pk_live_/);
      expect(result.type).toBe(ApiKeyType.publishable);
    });

    it('should never expose keyHash in response', async () => {
      (prisma.apiKey.create as jest.Mock).mockResolvedValue({
        id: 'key-3',
        keyHash: 'should_not_appear',
        prefix: 'nw_sk_live_XXXX',
        type: ApiKeyType.secret,
        createdAt: new Date('2025-01-01'),
      });

      const result = await service.generate('acc-1', {
        type: ApiKeyType.secret,
      });

      expect(result).not.toHaveProperty('keyHash');
      expect(JSON.stringify(result)).not.toContain('should_not_appear');
    });
  });

  describe('listByAccount()', () => {
    it('should return keys without hash', async () => {
      const mockKeys = [
        {
          id: 'key-1',
          prefix: 'nw_sk_live_XXXX',
          type: ApiKeyType.secret,
          projectId: null,
          createdAt: new Date('2025-01-01'),
        },
        {
          id: 'key-2',
          prefix: 'nw_pk_live_YYYY',
          type: ApiKeyType.publishable,
          projectId: 'proj-1',
          createdAt: new Date('2025-01-02'),
        },
      ];
      (prisma.apiKey.findMany as jest.Mock).mockResolvedValue(mockKeys);

      const result = await service.listByAccount('acc-1');

      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty('keyHash');
      expect(result[1]).not.toHaveProperty('keyHash');
      expect(prisma.apiKey.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { accountId: 'acc-1' },
          select: expect.objectContaining({
            id: true,
            prefix: true,
            type: true,
            projectId: true,
            createdAt: true,
          }),
        }),
      );
    });
  });

  describe('revoke()', () => {
    it('should delete key when owned by account', async () => {
      (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
        id: 'key-1',
        accountId: 'acc-1',
      });
      (prisma.apiKey.delete as jest.Mock).mockResolvedValue({});

      const result = await service.revoke('key-1', 'acc-1');

      expect(result).toEqual({ deleted: true });
      expect(prisma.apiKey.delete).toHaveBeenCalledWith({
        where: { id: 'key-1' },
      });
    });

    it('should throw NotFoundException when key not found', async () => {
      (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.revoke('unknown', 'acc-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when key belongs to different account', async () => {
      (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
        id: 'key-1',
        accountId: 'acc-other',
      });

      await expect(service.revoke('key-1', 'acc-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('validateKey()', () => {
    it('should return key record when hash matches', async () => {
      const mockRecord = {
        id: 'key-1',
        keyHash: 'abc123',
        accountId: 'acc-1',
        type: ApiKeyType.secret,
      };
      (prisma.apiKey.findFirst as jest.Mock).mockResolvedValue(mockRecord);

      const result = await service.validateKey('nw_sk_live_somerawkey');

      expect(result).toEqual(mockRecord);
      expect(prisma.apiKey.findFirst).toHaveBeenCalledWith({
        where: { keyHash: expect.any(String) },
      });
    });

    it('should return null when not found', async () => {
      (prisma.apiKey.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.validateKey('nw_sk_live_invalidkey');

      expect(result).toBeNull();
    });
  });

  describe('event emissions', () => {
    it('should emit api-key.created on generate', async () => {
      (prisma.apiKey.create as jest.Mock).mockResolvedValue({
        id: 'key-1',
        keyHash: 'somehash',
        prefix: 'nw_sk_live_XXXX',
        type: ApiKeyType.secret,
        createdAt: new Date('2025-01-01'),
      });

      await service.generate('acc-1', { type: ApiKeyType.secret });

      expect(eventEmitter.emit).toHaveBeenCalledWith('api-key.created', {
        accountId: 'acc-1',
        keyPrefix: expect.any(String),
        type: ApiKeyType.secret,
      });
    });

    it('should emit api-key.revoked on revoke', async () => {
      (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
        id: 'key-1',
        accountId: 'acc-1',
        prefix: 'nw_sk_live_XXXX',
      });
      (prisma.apiKey.delete as jest.Mock).mockResolvedValue({});

      await service.revoke('key-1', 'acc-1');

      expect(eventEmitter.emit).toHaveBeenCalledWith('api-key.revoked', {
        accountId: 'acc-1',
        keyPrefix: 'nw_sk_live_XXXX',
      });
    });
  });
});
