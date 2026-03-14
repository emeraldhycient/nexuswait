import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotificationWorkerService } from './notification-worker.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ data: { id: 'email-1' }, error: null }),
    },
  })),
}));

describe('NotificationWorkerService', () => {
  let service: NotificationWorkerService;
  let prisma: jest.Mocked<PrismaService>;
  let resendSend: jest.Mock;

  beforeEach(async () => {
    const mockPrisma = {
      notification: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };

    const mockConfig = {
      get: jest.fn((key: string) => {
        if (key === 'RESEND_API_KEY') return 'test-api-key';
        if (key === 'EMAIL_FROM') return 'Test <test@example.com>';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationWorkerService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get(NotificationWorkerService);
    prisma = module.get(PrismaService);

    // Access the mocked Resend instance
    resendSend = (service as any).resend.emails.send;
  });

  afterEach(() => {
    // Clear the interval to prevent test leaks
    service.onModuleDestroy();
  });

  describe('substitute', () => {
    it('should replace placeholders with values', () => {
      const result = service.substitute(
        'Hello {{name}}, welcome to {{project}}!',
        { name: 'John', project: 'NexusWait' },
      );
      expect(result).toBe('Hello John, welcome to NexusWait!');
    });

    it('should handle placeholders with spaces', () => {
      const result = service.substitute(
        'Hello {{ name }}, your count is {{ count }}.',
        { name: 'Jane', count: '42' },
      );
      expect(result).toBe('Hello Jane, your count is 42.');
    });

    it('should leave unmatched placeholders as-is', () => {
      const result = service.substitute(
        'Hello {{name}}, your {{unknown}} is ready.',
        { name: 'John' },
      );
      expect(result).toBe('Hello John, your {{unknown}} is ready.');
    });

    it('should replace multiple occurrences of the same placeholder', () => {
      const result = service.substitute(
        '{{name}} did it. Yes, {{name}} really did.',
        { name: 'Alice' },
      );
      expect(result).toBe('Alice did it. Yes, Alice really did.');
    });
  });

  describe('processBatch (via interval)', () => {
    it('should send email and mark as sent on success', async () => {
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'n-1',
          recipient: 'user@test.com',
          payload: { projectName: 'Test' },
          attempts: 0,
          maxAttempts: 3,
          template: {
            body: '<p>Welcome to {{projectName}}</p>',
            subject: 'Welcome to {{projectName}}',
          },
        },
      ]);
      (prisma.notification.update as jest.Mock).mockResolvedValue({});
      resendSend.mockResolvedValue({ data: { id: 'email-1' }, error: null });

      // Trigger processBatch manually
      await (service as any).processBatch();

      expect(resendSend).toHaveBeenCalledWith({
        from: 'Test <test@example.com>',
        to: 'user@test.com',
        subject: 'Welcome to Test',
        html: '<p>Welcome to Test</p>',
      });
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'n-1' },
        data: expect.objectContaining({
          status: 'sent',
          attempts: 1,
        }),
      });
    });

    it('should mark as failed and schedule retry on send error', async () => {
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'n-1',
          recipient: 'user@test.com',
          payload: {},
          attempts: 0,
          maxAttempts: 3,
          template: {
            body: '<p>Hello</p>',
            subject: 'Hello',
          },
        },
      ]);
      (prisma.notification.update as jest.Mock).mockResolvedValue({});
      resendSend.mockResolvedValue({ data: null, error: { message: 'Rate limited' } });

      await (service as any).processBatch();

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'n-1' },
        data: expect.objectContaining({
          status: 'failed',
          attempts: 1,
          lastError: 'Rate limited',
          nextRetryAt: expect.any(Date),
        }),
      });
    });

    it('should mark as dead_letter after max attempts', async () => {
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'n-1',
          recipient: 'user@test.com',
          payload: {},
          attempts: 2,
          maxAttempts: 3,
          template: {
            body: '<p>Hello</p>',
            subject: 'Hello',
          },
        },
      ]);
      (prisma.notification.update as jest.Mock).mockResolvedValue({});
      resendSend.mockResolvedValue({ data: null, error: { message: 'Failed again' } });

      await (service as any).processBatch();

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'n-1' },
        data: expect.objectContaining({
          status: 'dead_letter',
          attempts: 3,
          nextRetryAt: null,
        }),
      });
    });

    it('should skip notifications that exceed max attempts', async () => {
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'n-1',
          recipient: 'user@test.com',
          payload: {},
          attempts: 3,
          maxAttempts: 3,
          template: {
            body: '<p>Hello</p>',
            subject: 'Hello',
          },
        },
      ]);

      await (service as any).processBatch();

      expect(resendSend).not.toHaveBeenCalled();
      expect(prisma.notification.update).not.toHaveBeenCalled();
    });

    it('should use default subject when template has no subject', async () => {
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'n-1',
          recipient: 'user@test.com',
          payload: {},
          attempts: 0,
          maxAttempts: 3,
          template: {
            body: '<p>Hello</p>',
            subject: null,
          },
        },
      ]);
      (prisma.notification.update as jest.Mock).mockResolvedValue({});
      resendSend.mockResolvedValue({ data: { id: 'email-1' }, error: null });

      await (service as any).processBatch();

      expect(resendSend).toHaveBeenCalledWith(
        expect.objectContaining({ subject: 'NexusWait Notification' }),
      );
    });
  });
});
