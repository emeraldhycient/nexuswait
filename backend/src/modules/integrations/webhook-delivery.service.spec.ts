import { Test, TestingModule } from '@nestjs/testing';
import { WebhookDeliveryService } from './webhook-delivery.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { createHmac } from 'crypto';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WebhookDeliveryService', () => {
  let service: WebhookDeliveryService;
  let prisma: jest.Mocked<PrismaService>;

  const mockWebhookIntegration = {
    id: 'int-1',
    projectId: 'proj-1',
    type: 'webhook',
    displayName: 'My Webhook',
    config: { url: 'https://example.com/webhook' },
    events: ['waitlist.signup.created'],
    enabled: true,
    lastTriggeredAt: null,
    failureCount: 0,
  };

  const mockWebhookWithSecret = {
    ...mockWebhookIntegration,
    id: 'int-2',
    config: { url: 'https://example.com/webhook', secret: 'my-secret-key' },
  };

  beforeEach(async () => {
    const mockPrisma = {
      integration: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
      webhookDeliveryLog: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({}),
        create: jest.fn().mockResolvedValue({}),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookDeliveryService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(WebhookDeliveryService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('handleSignup', () => {
    it('should fetch enabled integrations and deliver to each', async () => {
      const integration1 = { ...mockWebhookIntegration, id: 'int-1' };
      const integration2 = { ...mockWebhookIntegration, id: 'int-2' };
      (prisma.integration.findMany as jest.Mock).mockResolvedValue([integration1, integration2]);
      mockedAxios.post.mockResolvedValue({ status: 200 });
      (prisma.integration.update as jest.Mock).mockResolvedValue({});

      const payload = { projectId: 'proj-1', subscriber: { email: 'test@example.com' } };
      await service.handleSignup(payload);

      expect(prisma.integration.findMany).toHaveBeenCalledWith({
        where: {
          projectId: 'proj-1',
          enabled: true,
          events: { has: 'waitlist.signup.created' },
        },
      });
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    });
  });

  describe('deliverWebhook', () => {
    it('should send POST with correct headers', async () => {
      mockedAxios.post.mockResolvedValue({ status: 200 });
      (prisma.integration.update as jest.Mock).mockResolvedValue({});

      const payload = { event: 'waitlist.signup.created', data: { email: 'test@example.com' } };
      await service.deliverWebhook(mockWebhookIntegration, payload);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://example.com/webhook',
        payload,
        expect.objectContaining({
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          timeout: 10000,
        }),
      );
    });

    it('should add HMAC signature when secret configured', async () => {
      mockedAxios.post.mockResolvedValue({ status: 200 });
      (prisma.integration.update as jest.Mock).mockResolvedValue({});

      const payload = { event: 'waitlist.signup.created', data: { email: 'test@example.com' } };
      await service.deliverWebhook(mockWebhookWithSecret, payload);

      const expectedSignature = createHmac('sha256', 'my-secret-key')
        .update(JSON.stringify(payload))
        .digest('hex');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://example.com/webhook',
        payload,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-NexusWait-Signature': expectedSignature,
          }),
        }),
      );
    });

    it('should reset failure count on success', async () => {
      mockedAxios.post.mockResolvedValue({ status: 200 });
      (prisma.integration.update as jest.Mock).mockResolvedValue({});

      await service.deliverWebhook(mockWebhookIntegration, { test: true });

      expect(prisma.integration.update).toHaveBeenCalledWith({
        where: { id: 'int-1' },
        data: expect.objectContaining({ failureCount: 0 }),
      });
    });

    it('should increment failure count on error', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Connection refused'));
      (prisma.integration.update as jest.Mock).mockResolvedValue({});

      await service.deliverWebhook(mockWebhookIntegration, { test: true });

      expect(prisma.integration.update).toHaveBeenCalledWith({
        where: { id: 'int-1' },
        data: { failureCount: { increment: 1 } },
      });
    });

    it('should skip non-webhook integrations', async () => {
      const slackIntegration = { ...mockWebhookIntegration, type: 'slack' };

      await service.deliverWebhook(slackIntegration, { test: true });

      expect(mockedAxios.post).not.toHaveBeenCalled();
      expect(prisma.integration.update).not.toHaveBeenCalled();
    });

    it('should skip integrations without url in config', async () => {
      const noUrlIntegration = { ...mockWebhookIntegration, config: {} };

      await service.deliverWebhook(noUrlIntegration, { test: true });

      expect(mockedAxios.post).not.toHaveBeenCalled();
      expect(prisma.integration.update).not.toHaveBeenCalled();
    });

    it('should skip duplicate delivery when idempotency key already succeeded', async () => {
      (prisma.webhookDeliveryLog.findUnique as jest.Mock).mockResolvedValue({
        idempotencyKey: 'some-key',
        success: true,
      });

      const payload = { event: 'waitlist.signup.created', data: { email: 'test@example.com' }, subscriber: { id: 'sub-1' } };
      await service.deliverWebhook(mockWebhookIntegration, payload, 'waitlist.signup.created');

      expect(mockedAxios.post).not.toHaveBeenCalled();
      expect(prisma.integration.update).not.toHaveBeenCalled();
    });

    it('should allow re-delivery when previous delivery failed', async () => {
      (prisma.webhookDeliveryLog.findUnique as jest.Mock).mockResolvedValue({
        idempotencyKey: 'some-key',
        success: false,
      });
      mockedAxios.post.mockResolvedValue({ status: 200 });
      (prisma.integration.update as jest.Mock).mockResolvedValue({});

      const payload = { event: 'waitlist.signup.created', data: { email: 'test@example.com' }, subscriber: { id: 'sub-1' } };
      await service.deliverWebhook(mockWebhookIntegration, payload, 'waitlist.signup.created');

      expect(mockedAxios.post).toHaveBeenCalled();
    });

    it('should log successful delivery via upsert', async () => {
      mockedAxios.post.mockResolvedValue({ status: 200, data: { ok: true } });
      (prisma.integration.update as jest.Mock).mockResolvedValue({});

      const payload = { event: 'waitlist.signup.created', data: { email: 'test@example.com' } };
      await service.deliverWebhook(mockWebhookIntegration, payload, 'waitlist.signup.created');

      expect(prisma.webhookDeliveryLog.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            integrationId: 'int-1',
            event: 'waitlist.signup.created',
            success: true,
            responseStatus: 200,
          }),
        }),
      );
    });

    it('should log failed delivery with error details', async () => {
      const axiosError = Object.assign(new Error('Server Error'), {
        response: { status: 500, data: { error: 'Internal' } },
      });
      mockedAxios.post.mockRejectedValue(axiosError);
      (prisma.integration.update as jest.Mock).mockResolvedValue({});

      const payload = { event: 'waitlist.signup.created', data: { email: 'test@example.com' } };
      await service.deliverWebhook(mockWebhookIntegration, payload, 'waitlist.signup.created');

      expect(prisma.webhookDeliveryLog.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            integrationId: 'int-1',
            success: false,
            error: 'Server Error',
            responseStatus: 500,
          }),
        }),
      );
    });

    it('should update lastTriggeredAt on success', async () => {
      mockedAxios.post.mockResolvedValue({ status: 200 });
      (prisma.integration.update as jest.Mock).mockResolvedValue({});

      await service.deliverWebhook(mockWebhookIntegration, { test: true });

      expect(prisma.integration.update).toHaveBeenCalledWith({
        where: { id: 'int-1' },
        data: expect.objectContaining({
          lastTriggeredAt: expect.any(Date),
          failureCount: 0,
        }),
      });
    });
  });

  describe('deliverTest', () => {
    it('should create test payload and call deliverWebhook', async () => {
      mockedAxios.post.mockResolvedValue({ status: 200 });
      (prisma.integration.update as jest.Mock).mockResolvedValue({});

      await service.deliverTest(mockWebhookIntegration);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://example.com/webhook',
        expect.objectContaining({
          event: 'test',
          integration: expect.objectContaining({
            id: 'int-1',
            type: 'webhook',
            displayName: 'My Webhook',
          }),
          data: expect.objectContaining({
            message: 'This is a test webhook delivery from NexusWait',
          }),
        }),
        expect.any(Object),
      );
    });
  });
});
