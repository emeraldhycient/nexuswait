import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

describe('ProjectsController', () => {
  let controller: ProjectsController;
  let service: jest.Mocked<ProjectsService>;

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [{ provide: ProjectsService, useValue: mockService }],
    }).compile();
    controller = module.get(ProjectsController);
    service = module.get(ProjectsService);
  });

  it('should create project and return result', async () => {
    const body = { name: 'Test' };
    const accountId = 'acc-1';
    const created = { id: 'p1', name: 'Test', slug: 'test', accountId };
    (service.create as jest.Mock).mockResolvedValue(created);
    const result = await controller.create({ accountId }, body);
    expect(result).toEqual(created);
    expect(service.create).toHaveBeenCalledWith(accountId, body);
  });

  it('should return list from findAll', async () => {
    const list = [{ id: 'p1', name: 'P1' }];
    (service.findAll as jest.Mock).mockResolvedValue(list);
    const result = await controller.findAll({ accountId: 'acc-1' });
    expect(result).toEqual(list);
  });
});
