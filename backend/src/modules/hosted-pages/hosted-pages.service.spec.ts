import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HostedPagesService } from './hosted-pages.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { UpsertHostedPageDto } from './dto/upsert-hosted-page.dto';

describe('HostedPagesService', () => {
  let service: HostedPagesService;
  let prisma: jest.Mocked<PrismaService>;
  let eventEmitter: { emit: jest.Mock };

  const mockProject = { id: 'proj-1', accountId: 'acc-1', name: 'Test Project' };

  const mockHostedPage = {
    id: 'hp-1',
    projectId: 'proj-1',
    slug: 'my-waitlist',
    title: 'Join the Waitlist',
    metaDescription: 'Sign up for early access',
    ogImageUrl: 'https://example.com/og.png',
    themeId: 'theme-1',
    themeOverrides: null,
    sections: [],
    formConfig: {},
    successConfig: {},
    status: 'draft',
    publishedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const upsertDto: UpsertHostedPageDto = {
    slug: 'my-waitlist',
    title: 'Join the Waitlist',
    metaDescription: 'Sign up for early access',
    ogImageUrl: 'https://example.com/og.png',
    themeId: 'theme-1',
    themeOverrides: undefined,
    sections: [{ id: 's1', type: 'hero', label: 'Hero', enabled: true, content: { heading: 'Welcome' } }],
    formConfig: { fields: ['email'] },
    successConfig: { message: 'Thank you!' },
  };

  beforeEach(async () => {
    const mockPrisma = {
      project: {
        findUnique: jest.fn(),
      },
      hostedPage: {
        upsert: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    eventEmitter = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HostedPagesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get(HostedPagesService);
    prisma = module.get(PrismaService);
  });

  describe('upsert', () => {
    it('should create or update a hosted page', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
      (prisma.hostedPage.upsert as jest.Mock).mockResolvedValue(mockHostedPage);

      const result = await service.upsert('proj-1', 'acc-1', upsertDto);

      expect(result).toEqual(mockHostedPage);
      expect(prisma.hostedPage.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: 'proj-1' },
          create: expect.objectContaining({ projectId: 'proj-1', slug: 'my-waitlist' }),
          update: expect.objectContaining({ slug: 'my-waitlist', title: 'Join the Waitlist' }),
        }),
      );
    });

    it('should throw NotFoundException for wrong project ownership', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.upsert('proj-999', 'acc-1', upsertDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findOne', () => {
    it('should return the hosted page', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
      (prisma.hostedPage.findUnique as jest.Mock).mockResolvedValue(mockHostedPage);

      const result = await service.findOne('proj-1', 'acc-1');

      expect(result).toEqual(mockHostedPage);
      expect(prisma.hostedPage.findUnique).toHaveBeenCalledWith({ where: { projectId: 'proj-1' } });
    });

    it('should throw NotFoundException when page not found', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
      (prisma.hostedPage.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('proj-1', 'acc-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should modify page fields', async () => {
      const updatedPage = { ...mockHostedPage, slug: 'new-slug', title: 'New Title' };
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
      (prisma.hostedPage.findUnique as jest.Mock).mockResolvedValue(mockHostedPage);
      (prisma.hostedPage.update as jest.Mock).mockResolvedValue(updatedPage);

      const result = await service.update('proj-1', 'acc-1', { slug: 'new-slug', title: 'New Title' });

      expect(result.slug).toBe('new-slug');
      expect(result.title).toBe('New Title');
      expect(prisma.hostedPage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: 'proj-1' },
          data: expect.objectContaining({ slug: 'new-slug', title: 'New Title' }),
        }),
      );
    });
  });

  describe('publish', () => {
    it('should set status to published', async () => {
      const publishedPage = { ...mockHostedPage, status: 'published', publishedAt: new Date() };
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
      (prisma.hostedPage.findUnique as jest.Mock).mockResolvedValue(mockHostedPage);
      (prisma.hostedPage.update as jest.Mock).mockResolvedValue(publishedPage);

      const result = await service.publish('proj-1', 'acc-1');

      expect(result.status).toBe('published');
      expect(result.publishedAt).toBeTruthy();
      expect(prisma.hostedPage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: 'proj-1' },
          data: expect.objectContaining({ status: 'published' }),
        }),
      );
    });

    it('should throw NotFoundException when page does not exist', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
      (prisma.hostedPage.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.publish('proj-1', 'acc-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySlug', () => {
    it('should return public page data for a published slug', async () => {
      const publishedPage = {
        ...mockHostedPage,
        status: 'published',
        publishedAt: new Date(),
        themeOverrides: { primaryColor: '#ff0000' },
        sections: [{ id: 's1', type: 'hero', label: 'Hero', enabled: true, content: { headline: 'Hi' } }],
        formConfig: { ctaText: 'Join' },
        successConfig: { message: 'Thanks!' },
        project: { customFields: [{ id: 'f1', label: 'Company', fieldKey: 'company', type: 'text', required: false }] },
      };
      (prisma.hostedPage.findFirst as jest.Mock).mockResolvedValue(publishedPage);

      const result = await service.findBySlug('my-waitlist');

      expect(result).toEqual({
        slug: 'my-waitlist',
        title: 'Join the Waitlist',
        metaDescription: 'Sign up for early access',
        ogImageUrl: 'https://example.com/og.png',
        themeId: 'theme-1',
        themeOverrides: { primaryColor: '#ff0000' },
        sections: publishedPage.sections,
        formConfig: { ctaText: 'Join' },
        successConfig: { message: 'Thanks!' },
        projectId: 'proj-1',
        customFields: publishedPage.project.customFields,
      });
      expect(prisma.hostedPage.findFirst).toHaveBeenCalledWith({
        where: { slug: 'my-waitlist', status: 'published' },
        include: { project: { select: { customFields: true } } },
      });
    });

    it('should throw NotFoundException when slug does not exist', async () => {
      (prisma.hostedPage.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.findBySlug('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for a draft page slug', async () => {
      (prisma.hostedPage.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.findBySlug('my-waitlist')).rejects.toThrow(NotFoundException);
      expect(prisma.hostedPage.findFirst).toHaveBeenCalledWith({
        where: { slug: 'my-waitlist', status: 'published' },
        include: { project: { select: { customFields: true } } },
      });
    });
  });

  describe('unpublish', () => {
    it('should set status to draft with null publishedAt', async () => {
      const publishedPage = { ...mockHostedPage, status: 'published', publishedAt: new Date() };
      const unpublishedPage = { ...mockHostedPage, status: 'draft', publishedAt: null };
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
      (prisma.hostedPage.findUnique as jest.Mock).mockResolvedValue(publishedPage);
      (prisma.hostedPage.update as jest.Mock).mockResolvedValue(unpublishedPage);

      const result = await service.unpublish('proj-1', 'acc-1');

      expect(result.status).toBe('draft');
      expect(result.publishedAt).toBeNull();
      expect(prisma.hostedPage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: 'proj-1' },
          data: { status: 'draft', publishedAt: null },
        }),
      );
    });

    it('should throw NotFoundException when page does not exist', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
      (prisma.hostedPage.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.unpublish('proj-1', 'acc-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('event emissions', () => {
    it('should emit hosted-page.published on publish', async () => {
      const publishedPage = { ...mockHostedPage, status: 'published', publishedAt: new Date() };
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);
      (prisma.hostedPage.findUnique as jest.Mock).mockResolvedValue(mockHostedPage);
      (prisma.hostedPage.update as jest.Mock).mockResolvedValue(publishedPage);

      await service.publish('proj-1', 'acc-1');

      expect(eventEmitter.emit).toHaveBeenCalledWith('hosted-page.published', {
        accountId: 'acc-1',
        projectId: 'proj-1',
        page: expect.objectContaining({
          slug: 'my-waitlist',
          title: 'Join the Waitlist',
        }),
      });
    });
  });
});
