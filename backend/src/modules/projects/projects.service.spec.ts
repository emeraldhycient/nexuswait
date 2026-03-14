import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { PlanEnforcementService } from '../plan-config/plan-enforcement.service';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: jest.Mocked<PrismaService>;
  let eventEmitter: { emit: jest.Mock };

  beforeEach(async () => {
    const mockPrisma = {
      project: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
    };
    const mockPlanEnforcement = {
      checkProjectLimit: jest.fn().mockResolvedValue(undefined),
      checkSubscriberLimit: jest.fn().mockResolvedValue(undefined),
      checkIntegrationLimit: jest.fn().mockResolvedValue(undefined),
    };
    eventEmitter = { emit: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PlanEnforcementService, useValue: mockPlanEnforcement },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();
    service = module.get(ProjectsService);
    prisma = module.get(PrismaService);
  });

  it('should create project with slug from name', async () => {
    (prisma.project.create as jest.Mock).mockResolvedValue({
      id: 'p1',
      name: 'My Project',
      slug: 'my-project',
      accountId: 'acc-1',
    });
    const result = await service.create('acc-1', { name: 'My Project' });
    expect(result.slug).toBe('my-project');
    expect(prisma.project.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: 'My Project', accountId: 'acc-1' }),
      }),
    );
  });

  it('should throw when findOne gets unknown id', async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(service.findOne('unknown', 'acc-1')).rejects.toThrow(NotFoundException);
  });

  it('should update project', async () => {
    (prisma.project.findUnique as jest.Mock).mockResolvedValue({ id: 'p1', accountId: 'acc-1' });
    (prisma.project.update as jest.Mock).mockResolvedValue({ id: 'p1', name: 'Updated' });
    const result = await service.update('p1', 'acc-1', { name: 'Updated' });
    expect(result.name).toBe('Updated');
  });

  describe('findAllPaginated', () => {
    const sampleProjects = [
      { id: 'p1', name: 'Alpha', status: 'active', _count: { subscribers: 10 } },
      { id: 'p2', name: 'Beta', status: 'paused', _count: { subscribers: 5 } },
    ];

    it('should return paginated results with defaults', async () => {
      (prisma.project.findMany as jest.Mock).mockResolvedValue(sampleProjects);
      (prisma.project.count as jest.Mock).mockResolvedValue(2);
      const result = await service.findAllPaginated('acc-1', {});
      expect(result).toEqual({ data: sampleProjects, total: 2, page: 1, limit: 15 });
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
          skip: 0,
          take: 15,
        }),
      );
    });

    it('should filter by search term', async () => {
      (prisma.project.findMany as jest.Mock).mockResolvedValue([sampleProjects[0]]);
      (prisma.project.count as jest.Mock).mockResolvedValue(1);
      await service.findAllPaginated('acc-1', { search: 'Alpha' });
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: 'Alpha', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('should filter by status', async () => {
      (prisma.project.findMany as jest.Mock).mockResolvedValue([sampleProjects[1]]);
      (prisma.project.count as jest.Mock).mockResolvedValue(1);
      await service.findAllPaginated('acc-1', { status: 'paused' });
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'paused' }),
        }),
      );
    });

    it('should fall back to createdAt when sortBy is invalid', async () => {
      (prisma.project.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.project.count as jest.Mock).mockResolvedValue(0);
      await service.findAllPaginated('acc-1', { sortBy: 'invalid_field', sortOrder: 'asc' });
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'asc' },
        }),
      );
    });

    it('should apply valid sortBy and sortOrder', async () => {
      (prisma.project.findMany as jest.Mock).mockResolvedValue(sampleProjects);
      (prisma.project.count as jest.Mock).mockResolvedValue(2);
      await service.findAllPaginated('acc-1', { sortBy: 'name', sortOrder: 'asc' });
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        }),
      );
    });
  });

  describe('event emissions', () => {
    it('should emit project.created on create', async () => {
      (prisma.project.create as jest.Mock).mockResolvedValue({
        id: 'p1',
        name: 'My Project',
        slug: 'my-project',
        accountId: 'acc-1',
      });
      // ensureUniqueSlug - slug is unique
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

      await service.create('acc-1', { name: 'My Project' });

      expect(eventEmitter.emit).toHaveBeenCalledWith('project.created', {
        accountId: 'acc-1',
        project: { id: 'p1', name: 'My Project', slug: 'my-project' },
      });
    });

    it('should emit project.archived on remove', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue({
        id: 'p1',
        name: 'My Project',
        accountId: 'acc-1',
      });
      (prisma.project.update as jest.Mock).mockResolvedValue({
        id: 'p1',
        status: 'archived',
      });

      await service.remove('p1', 'acc-1');

      expect(eventEmitter.emit).toHaveBeenCalledWith('project.archived', {
        accountId: 'acc-1',
        project: { id: 'p1', name: 'My Project' },
      });
    });
  });
});
