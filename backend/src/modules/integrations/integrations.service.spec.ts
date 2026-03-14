import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IntegrationsService } from './integrations.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { WebhookDeliveryService } from './webhook-delivery.service';
import { PlanEnforcementService } from '../plan-config/plan-enforcement.service';

describe('IntegrationsService', () => {
  let service: IntegrationsService;
  let prisma: jest.Mocked<PrismaService>;
  let webhookDelivery: jest.Mocked<WebhookDeliveryService>;
  let eventEmitter: { emit: jest.Mock };

  const mockProject = { id: 'proj-1', accountId: 'acc-1', name: 'Test Project' };

  const mockIntegration = {
    id: 'int-1',
    projectId: 'proj-1',
    type: 'webhook',
    displayName: 'My Webhook',
    config: { url: 'https://example.com/webhook' },
    fieldMapping: null,
    events: ['waitlist.signup.created'],
    enabled: true,
    lastTriggeredAt: null,
    failureCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrisma = {
      project: {
        findUnique: jest.fn(),
      },
      integration: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const mockWebhookDelivery = {
      deliverTest: jest.fn(),
    };

    const mockPlanEnforcement = {
      checkProjectLimit: jest.fn().mockResolvedValue(undefined),
      checkSubscriberLimit: jest.fn().mockResolvedValue(undefined),
      checkIntegrationLimit: jest.fn().mockResolvedValue(undefined),
    };

    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntegrationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: WebhookDeliveryService, useValue: mockWebhookDelivery },
        { provide: PlanEnforcementService, useValue: mockPlanEnforcement },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get(IntegrationsService);
    prisma = module.get(PrismaService);
    webhookDelivery = module.get(WebhookDeliveryService);
  });

  describe('create', () => {
    it('should create integration after ownership check', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
      (prisma.integration.create as jest.Mock).mockResolvedValue(mockIntegration);

      const dto = {
        type: 'webhook',
        displayName: 'My Webhook',
        config: { url: 'https://example.com/webhook' },
        events: ['waitlist.signup.created'],
      };

      const result = await service.create('proj-1', 'acc-1', dto as any);

      expect(result).toEqual(mockIntegration);
      expect(prisma.project.findUnique).toHaveBeenCalledWith({ where: { id: 'proj-1' } });
      expect(prisma.integration.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            projectId: 'proj-1',
            type: 'webhook',
            displayName: 'My Webhook',
          }),
        }),
      );
    });

    it('should throw NotFoundException for wrong project', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.create('proj-999', 'acc-1', {
          type: 'webhook',
          displayName: 'Test',
          config: {},
          events: [],
        } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return integrations for project', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
      (prisma.integration.findMany as jest.Mock).mockResolvedValue([mockIntegration]);

      const result = await service.findAll('proj-1', 'acc-1');

      expect(result).toEqual([mockIntegration]);
      expect(prisma.integration.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: 'proj-1' },
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return single integration', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
      (prisma.integration.findFirst as jest.Mock).mockResolvedValue(mockIntegration);

      const result = await service.findOne('proj-1', 'int-1', 'acc-1');

      expect(result).toEqual(mockIntegration);
      expect(prisma.integration.findFirst).toHaveBeenCalledWith({
        where: { id: 'int-1', projectId: 'proj-1' },
      });
    });

    it('should throw NotFoundException when not found', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
      (prisma.integration.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('proj-1', 'int-999', 'acc-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should modify integration', async () => {
      const updatedIntegration = { ...mockIntegration, displayName: 'Updated Webhook' };
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
      (prisma.integration.findFirst as jest.Mock).mockResolvedValue(mockIntegration);
      (prisma.integration.update as jest.Mock).mockResolvedValue(updatedIntegration);

      const result = await service.update('proj-1', 'int-1', 'acc-1', {
        displayName: 'Updated Webhook',
      } as any);

      expect(result.displayName).toBe('Updated Webhook');
      expect(prisma.integration.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'int-1' },
          data: expect.objectContaining({ displayName: 'Updated Webhook' }),
        }),
      );
    });
  });

  describe('remove', () => {
    it('should delete integration', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
      (prisma.integration.findFirst as jest.Mock).mockResolvedValue(mockIntegration);
      (prisma.integration.delete as jest.Mock).mockResolvedValue(mockIntegration);

      const result = await service.remove('proj-1', 'int-1', 'acc-1');

      expect(result).toEqual(mockIntegration);
      expect(prisma.integration.delete).toHaveBeenCalledWith({
        where: { id: 'int-1' },
      });
    });
  });

  describe('test', () => {
    it('should call webhookDelivery.deliverTest', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
      (prisma.integration.findFirst as jest.Mock).mockResolvedValue(mockIntegration);
      (webhookDelivery.deliverTest as jest.Mock).mockResolvedValue(undefined);

      const result = await service.test('proj-1', 'int-1', 'acc-1');

      expect(result).toEqual({ success: true });
      expect(webhookDelivery.deliverTest).toHaveBeenCalledWith(mockIntegration);
    });

    it('should throw NotFoundException when integration not found', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
      (prisma.integration.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.test('proj-1', 'int-999', 'acc-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('event emissions', () => {
    it('should emit integration.created on create', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
      (prisma.integration.create as jest.Mock).mockResolvedValue(mockIntegration);

      await service.create('proj-1', 'acc-1', {
        type: 'webhook',
        displayName: 'My Webhook',
        config: { url: 'https://example.com/webhook' },
        events: ['waitlist.signup.created'],
      } as any);

      expect(eventEmitter.emit).toHaveBeenCalledWith('integration.created', {
        accountId: 'acc-1',
        projectId: 'proj-1',
        integration: { id: 'int-1', type: 'webhook', displayName: 'My Webhook' },
      });
    });

    it('should emit integration.removed on remove', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
      (prisma.integration.findFirst as jest.Mock).mockResolvedValue(mockIntegration);
      (prisma.integration.delete as jest.Mock).mockResolvedValue(mockIntegration);

      await service.remove('proj-1', 'int-1', 'acc-1');

      expect(eventEmitter.emit).toHaveBeenCalledWith('integration.removed', {
        accountId: 'acc-1',
        projectId: 'proj-1',
        integration: { id: 'int-1', type: 'webhook', displayName: 'My Webhook' },
      });
    });
  });
});
