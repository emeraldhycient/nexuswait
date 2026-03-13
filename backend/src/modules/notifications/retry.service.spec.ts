import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RetryService } from './retry.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { WebhookDeliveryService } from '../integrations/webhook-delivery.service';

describe('RetryService', () => {
  let service: RetryService;
  let prisma: jest.Mocked<PrismaService>;
  let webhookDelivery: jest.Mocked<WebhookDeliveryService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const mockIntegration = {
    id: 'int-1',
    projectId: 'proj-1',
    type: 'webhook',
    displayName: 'My Webhook',
    config: { url: 'https://example.com/webhook' },
    events: ['waitlist.signup.created'],
    enabled: true,
    failureCount: 2,
    lastTriggeredAt: null,
    maxRetryAttempts: 5,
    updatedAt: new Date(Date.now() - 700_000), // 11+ minutes ago (past backoff)
    project: { id: 'proj-1', accountId: 'acc-1', name: 'Test Project' },
  };

  beforeEach(async () => {
    const mockPrisma = {
      integration: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const mockWebhookDelivery = {
      deliverWebhook: jest.fn(),
    };

    const mockEventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RetryService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: WebhookDeliveryService, useValue: mockWebhookDelivery },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get(RetryService);
    prisma = module.get(PrismaService);
    webhookDelivery = module.get(WebhookDeliveryService);
    eventEmitter = module.get(EventEmitter2);

    jest.clearAllMocks();
  });

  describe('processRetries', () => {
    it('should retry failed integrations that are eligible', async () => {
      (prisma.integration.findMany as jest.Mock).mockResolvedValue([mockIntegration]);
      (webhookDelivery.deliverWebhook as jest.Mock).mockResolvedValue(undefined);

      await service.processRetries();

      expect(webhookDelivery.deliverWebhook).toHaveBeenCalledWith(
        mockIntegration,
        expect.objectContaining({
          event: 'retry',
          integration: expect.objectContaining({ id: 'int-1' }),
        }),
        'retry',
      );
    });

    it('should skip integrations not yet eligible for retry', async () => {
      const recentFailure = {
        ...mockIntegration,
        failureCount: 1,
        updatedAt: new Date(), // Just now — not eligible yet
      };
      (prisma.integration.findMany as jest.Mock).mockResolvedValue([recentFailure]);

      await service.processRetries();

      expect(webhookDelivery.deliverWebhook).not.toHaveBeenCalled();
    });

    it('should disable integration and emit event after max retries', async () => {
      const almostMaxed = {
        ...mockIntegration,
        failureCount: 4, // Next failure hits max (5)
        updatedAt: new Date(Date.now() - 2_000_000), // Well past 30min backoff
      };
      (prisma.integration.findMany as jest.Mock).mockResolvedValue([almostMaxed]);
      (webhookDelivery.deliverWebhook as jest.Mock).mockRejectedValue(new Error('timeout'));
      (prisma.integration.findUnique as jest.Mock).mockResolvedValue({ failureCount: 5 });
      (prisma.integration.update as jest.Mock).mockResolvedValue({});

      await service.processRetries();

      expect(prisma.integration.update).toHaveBeenCalledWith({
        where: { id: 'int-1' },
        data: { enabled: false },
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'integration.webhook.failed',
        expect.objectContaining({
          integrationId: 'int-1',
          projectId: 'proj-1',
        }),
      );
    });
  });

  describe('retryIntegration', () => {
    it('should reset failure count and re-enable integration', async () => {
      (prisma.integration.findUnique as jest.Mock).mockResolvedValue(mockIntegration);
      (prisma.integration.update as jest.Mock).mockResolvedValue({});

      const result = await service.retryIntegration('int-1');

      expect(result.success).toBe(true);
      expect(prisma.integration.update).toHaveBeenCalledWith({
        where: { id: 'int-1' },
        data: { failureCount: 0, enabled: true },
      });
    });

    it('should return failure for non-existent integration', async () => {
      (prisma.integration.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.retryIntegration('int-999');

      expect(result.success).toBe(false);
    });
  });
});
