import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: jest.Mocked<PrismaService>;
  let config: jest.Mocked<ConfigService>;

  const MOCK_ACCOUNT_ID = 'acc-test-123';
  const MOCK_PRODUCT_ID = 'prod-pulse-monthly';
  const MOCK_SUBSCRIPTION_ID = 'sub-polar-456';
  const MOCK_CUSTOMER_ID = 'cus-polar-789';

  beforeEach(async () => {
    const mockPrisma = {
      account: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      planConfig: {
        findFirst: jest.fn(),
      },
      polarSubscription: {
        upsert: jest.fn(),
        updateMany: jest.fn(),
      },
      webhookEvent: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    const mockConfig = {
      get: jest.fn((key: string) => {
        const map: Record<string, string> = {
          POLAR_ACCESS_TOKEN: 'test-token',
          POLAR_WEBHOOK_SECRET: 'webhook-secret',
          FRONTEND_URL: 'http://localhost:5173',
        };
        return map[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get(PaymentsService);
    prisma = module.get(PrismaService);
    config = module.get(ConfigService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── Checkout ───────────────────────────────────────

  describe('createCheckoutSession', () => {
    it('should call Polar API and return checkout URL', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { url: 'https://checkout.polar.sh/abc123' },
      });

      const result = await service.createCheckoutSession(
        MOCK_ACCOUNT_ID,
        MOCK_PRODUCT_ID,
        'http://localhost:5173/success',
        'http://localhost:5173/cancel',
      );

      expect(result).toEqual({ url: 'https://checkout.polar.sh/abc123' });
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.polar.sh/v1/checkouts/',
        expect.objectContaining({
          product_id: MOCK_PRODUCT_ID,
          success_url: 'http://localhost:5173/success',
          cancel_url: 'http://localhost:5173/cancel',
          metadata: { accountId: MOCK_ACCOUNT_ID },
          external_customer_id: MOCK_ACCOUNT_ID,
        }),
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-token', 'Content-Type': 'application/json' },
        }),
      );
    });

    it('should return frontend URL when no POLAR_ACCESS_TOKEN', async () => {
      (config.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'POLAR_ACCESS_TOKEN') return undefined;
        if (key === 'FRONTEND_URL') return 'http://localhost:5173';
        return undefined;
      });

      const result = await service.createCheckoutSession(
        MOCK_ACCOUNT_ID,
        MOCK_PRODUCT_ID,
        'http://localhost:5173/success',
        'http://localhost:5173/cancel',
      );

      expect(result.url).toContain('/dashboard/settings?billing=1');
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should include customerEmail when provided', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { url: 'https://checkout.polar.sh/abc123' },
      });

      await service.createCheckoutSession(
        MOCK_ACCOUNT_ID,
        MOCK_PRODUCT_ID,
        'http://localhost:5173/success',
        'http://localhost:5173/cancel',
        'user@example.com',
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ customer_email: 'user@example.com' }),
        expect.any(Object),
      );
    });
  });

  // ─── Cancel Subscription ────────────────────────────

  describe('cancelSubscription', () => {
    it('should call Polar DELETE and return cancellation_requested', async () => {
      (prisma.account.findUnique as jest.Mock).mockResolvedValue({
        polarSubscriptionId: MOCK_SUBSCRIPTION_ID,
      });
      mockedAxios.delete.mockResolvedValue({ data: {} });

      const result = await service.cancelSubscription(MOCK_ACCOUNT_ID);

      expect(result).toEqual({ status: 'cancellation_requested' });
      expect(mockedAxios.delete).toHaveBeenCalledWith(
        `https://api.polar.sh/v1/subscriptions/${MOCK_SUBSCRIPTION_ID}`,
        expect.objectContaining({
          headers: { Authorization: 'Bearer test-token' },
        }),
      );
    });

    it('should return no_active_subscription when no subscription exists', async () => {
      (prisma.account.findUnique as jest.Mock).mockResolvedValue({
        polarSubscriptionId: null,
      });

      const result = await service.cancelSubscription(MOCK_ACCOUNT_ID);

      expect(result).toEqual({ status: 'no_active_subscription' });
      expect(mockedAxios.delete).not.toHaveBeenCalled();
    });

    it('should handle Polar API failure gracefully', async () => {
      (prisma.account.findUnique as jest.Mock).mockResolvedValue({
        polarSubscriptionId: MOCK_SUBSCRIPTION_ID,
      });
      mockedAxios.delete.mockRejectedValue(new Error('Network error'));

      const result = await service.cancelSubscription(MOCK_ACCOUNT_ID);

      // Should not throw, returns status anyway
      expect(result).toEqual({ status: 'cancellation_requested' });
    });
  });

  // ─── Product → Plan Mapping ─────────────────────────

  describe('mapProductToPlan', () => {
    it('should resolve tier from PlanConfig DB lookup', async () => {
      (prisma.planConfig.findFirst as jest.Mock).mockResolvedValue({ tier: 'pulse' });

      const result = await service.mapProductToPlan('some-product-id');

      expect(result).toBe('pulse');
      expect(prisma.planConfig.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { polarProductIdMonthly: 'some-product-id' },
            { polarProductIdYearly: 'some-product-id' },
          ],
        },
      });
    });

    it('should fallback to env vars when DB has no match', async () => {
      (prisma.planConfig.findFirst as jest.Mock).mockResolvedValue(null);
      (config.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'POLAR_PRODUCT_ID_PULSE') return 'env-pulse-id';
        if (key === 'POLAR_PRODUCT_ID_NEXUS') return 'env-nexus-id';
        return undefined;
      });

      expect(await service.mapProductToPlan('env-pulse-id')).toBe('pulse');
      expect(await service.mapProductToPlan('env-nexus-id')).toBe('nexus');
    });

    it('should default to spark for unknown product IDs', async () => {
      (prisma.planConfig.findFirst as jest.Mock).mockResolvedValue(null);
      (config.get as jest.Mock).mockReturnValue(undefined);

      const result = await service.mapProductToPlan('unknown-product-id');

      expect(result).toBe('spark');
    });
  });

  // ─── Webhook Handling ───────────────────────────────

  describe('handlePolarWebhook', () => {
    const makeWebhookPayload = (
      type: string,
      overrides: Record<string, unknown> = {},
    ) => ({
      id: 'evt-unique-001',
      type,
      data: {
        id: MOCK_SUBSCRIPTION_ID,
        customer_id: MOCK_CUSTOMER_ID,
        product_id: MOCK_PRODUCT_ID,
        external_customer_id: MOCK_ACCOUNT_ID,
        metadata: { accountId: MOCK_ACCOUNT_ID },
        ...overrides,
      },
    });

    beforeEach(() => {
      (prisma.webhookEvent.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.webhookEvent.create as jest.Mock).mockResolvedValue({});
      (prisma.account.findUnique as jest.Mock).mockResolvedValue({ id: MOCK_ACCOUNT_ID });
      (prisma.account.update as jest.Mock).mockResolvedValue({});
      (prisma.polarSubscription.upsert as jest.Mock).mockResolvedValue({});
      (prisma.polarSubscription.updateMany as jest.Mock).mockResolvedValue({});
      (prisma.planConfig.findFirst as jest.Mock).mockResolvedValue({ tier: 'pulse' });
    });

    it('should process subscription.created and upgrade account', async () => {
      const payload = makeWebhookPayload('subscription.created');

      await service.handlePolarWebhook(payload);

      expect(prisma.polarSubscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { accountId: MOCK_ACCOUNT_ID },
          create: expect.objectContaining({
            accountId: MOCK_ACCOUNT_ID,
            polarSubscriptionId: MOCK_SUBSCRIPTION_ID,
            polarCustomerId: MOCK_CUSTOMER_ID,
            plan: 'pulse',
            status: 'active',
          }),
        }),
      );
      expect(prisma.account.update).toHaveBeenCalledWith({
        where: { id: MOCK_ACCOUNT_ID },
        data: {
          plan: 'pulse',
          polarCustomerId: MOCK_CUSTOMER_ID,
          polarSubscriptionId: MOCK_SUBSCRIPTION_ID,
        },
      });
      expect(prisma.webhookEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventId: 'evt-unique-001',
          eventType: 'subscription.created',
          status: 'processed',
        }),
      });
    });

    it('should process subscription.updated the same as created', async () => {
      const payload = makeWebhookPayload('subscription.updated');

      await service.handlePolarWebhook(payload);

      expect(prisma.polarSubscription.upsert).toHaveBeenCalled();
      expect(prisma.account.update).toHaveBeenCalled();
    });

    it('should process subscription.cancelled and downgrade to spark', async () => {
      const payload = makeWebhookPayload('subscription.cancelled');

      await service.handlePolarWebhook(payload);

      expect(prisma.polarSubscription.updateMany).toHaveBeenCalledWith({
        where: { accountId: MOCK_ACCOUNT_ID },
        data: { status: 'cancelled' },
      });
      expect(prisma.account.update).toHaveBeenCalledWith({
        where: { id: MOCK_ACCOUNT_ID },
        data: { plan: 'spark', polarSubscriptionId: null },
      });
    });

    it('should process subscription.revoked same as cancelled', async () => {
      const payload = makeWebhookPayload('subscription.revoked');

      await service.handlePolarWebhook(payload);

      expect(prisma.polarSubscription.updateMany).toHaveBeenCalledWith({
        where: { accountId: MOCK_ACCOUNT_ID },
        data: { status: 'cancelled' },
      });
    });

    it('should skip duplicate webhook events (idempotency)', async () => {
      (prisma.webhookEvent.findUnique as jest.Mock).mockResolvedValue({
        eventId: 'evt-unique-001',
        status: 'processed',
      });

      const payload = makeWebhookPayload('subscription.created');
      const result = await service.handlePolarWebhook(payload);

      expect(result).toEqual({ skipped: true });
      expect(prisma.polarSubscription.upsert).not.toHaveBeenCalled();
      expect(prisma.account.update).not.toHaveBeenCalled();
    });

    it('should silently skip when account not found', async () => {
      (prisma.account.findUnique as jest.Mock).mockResolvedValue(null);

      const payload = makeWebhookPayload('subscription.created');
      await service.handlePolarWebhook(payload);

      expect(prisma.polarSubscription.upsert).not.toHaveBeenCalled();
    });

    it('should silently skip when no externalCustomerId', async () => {
      const payload = {
        id: 'evt-002',
        type: 'subscription.created',
        data: {
          id: MOCK_SUBSCRIPTION_ID,
          customer_id: MOCK_CUSTOMER_ID,
          product_id: MOCK_PRODUCT_ID,
          metadata: {},
        },
      };

      await service.handlePolarWebhook(payload);

      expect(prisma.account.findUnique).not.toHaveBeenCalled();
    });

    it('should record failed webhook event on error', async () => {
      (prisma.account.findUnique as jest.Mock).mockResolvedValue({ id: MOCK_ACCOUNT_ID });
      (prisma.polarSubscription.upsert as jest.Mock).mockRejectedValue(new Error('DB constraint'));

      const payload = makeWebhookPayload('subscription.created');

      await expect(service.handlePolarWebhook(payload)).rejects.toThrow('DB constraint');

      expect(prisma.webhookEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventId: 'evt-unique-001',
          eventType: 'subscription.created',
          status: 'failed',
          error: 'DB constraint',
        }),
      });
    });
  });

  // ─── Webhook Signature Verification ─────────────────

  describe('verifyWebhookSignature', () => {
    it('should return true when secret is not set', () => {
      (config.get as jest.Mock).mockReturnValue(undefined);

      const result = service.verifyWebhookSignature(Buffer.from('body'), 'any-sig');

      expect(result).toBe(true);
    });

    it('should return false when signature is empty', () => {
      const result = service.verifyWebhookSignature(Buffer.from('body'), '');

      expect(result).toBe(false);
    });

    it('should verify valid HMAC-SHA256 signature', () => {
      const { createHmac } = require('crypto');
      const body = Buffer.from('{"type":"subscription.created"}');
      const expected = createHmac('sha256', 'webhook-secret').update(body).digest('hex');

      const result = service.verifyWebhookSignature(body, expected);

      expect(result).toBe(true);
    });

    it('should reject invalid signature', () => {
      const body = Buffer.from('{"type":"subscription.created"}');

      const result = service.verifyWebhookSignature(body, 'deadbeef'.repeat(8));

      expect(result).toBe(false);
    });
  });
});
