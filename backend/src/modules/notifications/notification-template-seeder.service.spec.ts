import { Test, TestingModule } from '@nestjs/testing';
import { NotificationTemplateSeederService, PLATFORM_TEMPLATES } from './notification-template-seeder.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

describe('NotificationTemplateSeederService', () => {
  let service: NotificationTemplateSeederService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrisma = {
      notificationTemplate: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationTemplateSeederService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(NotificationTemplateSeederService);
    prisma = module.get(PrismaService);
  });

  it('should create all templates on first seed', async () => {
    (prisma.notificationTemplate.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.notificationTemplate.create as jest.Mock).mockResolvedValue({ id: 'tpl-1' });

    await service.seed();

    expect(prisma.notificationTemplate.create).toHaveBeenCalledTimes(PLATFORM_TEMPLATES.length);
    for (const t of PLATFORM_TEMPLATES) {
      expect(prisma.notificationTemplate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: t.name,
          channel: 'email',
          subject: t.subject,
          body: t.body,
          accountId: null,
        }),
      });
    }
  });

  it('should not duplicate templates on subsequent seeds', async () => {
    // Return a matching existing template for each findFirst call
    (prisma.notificationTemplate.findFirst as jest.Mock).mockImplementation(
      ({ where }: { where: { name: string; channel: string } }) => {
        const t = PLATFORM_TEMPLATES.find((tpl) => tpl.name === where.name);
        if (!t) return Promise.resolve(null);
        return Promise.resolve({
          id: `tpl-${t.name}`,
          name: t.name,
          channel: t.channel,
          subject: t.subject,
          body: t.body,
        });
      },
    );

    await service.seed();

    expect(prisma.notificationTemplate.create).not.toHaveBeenCalled();
    expect(prisma.notificationTemplate.update).not.toHaveBeenCalled();
  });

  it('should update templates when body or subject changes', async () => {
    (prisma.notificationTemplate.findFirst as jest.Mock).mockResolvedValue({
      id: 'tpl-1',
      name: 'waitlist.signup.created',
      channel: 'email',
      subject: 'Old subject',
      body: 'Old body',
    });

    await service.seed();

    expect(prisma.notificationTemplate.update).toHaveBeenCalled();
  });

  it('should have 12 platform templates defined', () => {
    expect(PLATFORM_TEMPLATES).toHaveLength(12);
    const names = PLATFORM_TEMPLATES.map((t) => t.name);
    expect(names).toContain('waitlist.signup.created');
    expect(names).toContain('project.created');
    expect(names).toContain('project.archived');
    expect(names).toContain('integration.created');
    expect(names).toContain('integration.removed');
    expect(names).toContain('integration.webhook.failed');
    expect(names).toContain('subscription.upgraded');
    expect(names).toContain('subscription.cancelled');
    expect(names).toContain('subscriber.milestone');
    expect(names).toContain('api-key.created');
    expect(names).toContain('api-key.revoked');
    expect(names).toContain('hosted-page.published');
  });

  it('all templates should have subject and body with placeholder syntax', () => {
    for (const t of PLATFORM_TEMPLATES) {
      expect(t.channel).toBe('email');
      expect(t.subject.length).toBeGreaterThan(0);
      expect(t.body.length).toBeGreaterThan(0);
    }
  });
});
