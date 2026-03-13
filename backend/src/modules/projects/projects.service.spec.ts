import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { PlanEnforcementService } from '../plan-config/plan-enforcement.service';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrisma = {
      project: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    const mockPlanEnforcement = {
      checkProjectLimit: jest.fn().mockResolvedValue(undefined),
      checkSubscriberLimit: jest.fn().mockResolvedValue(undefined),
      checkIntegrationLimit: jest.fn().mockResolvedValue(undefined),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PlanEnforcementService, useValue: mockPlanEnforcement },
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
});
