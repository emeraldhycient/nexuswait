import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { UpsertHostedPageDto } from './dto/upsert-hosted-page.dto';
import { UpdateHostedPageDto } from './dto/update-hosted-page.dto';

@Injectable()
export class HostedPagesService {
  constructor(private prisma: PrismaService) {}

  private async verifyProjectOwnership(projectId: string, accountId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.accountId !== accountId) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  async upsert(projectId: string, accountId: string, dto: UpsertHostedPageDto) {
    await this.verifyProjectOwnership(projectId, accountId);

    const jsonFields = {
      themeOverrides: (dto.themeOverrides ?? undefined) as any,
      sections: dto.sections as any,
      formConfig: dto.formConfig as any,
      successConfig: dto.successConfig as any,
    };

    return this.prisma.hostedPage.upsert({
      where: { projectId },
      create: {
        projectId,
        slug: dto.slug,
        title: dto.title,
        metaDescription: dto.metaDescription,
        ogImageUrl: dto.ogImageUrl,
        themeId: dto.themeId,
        ...jsonFields,
      },
      update: {
        slug: dto.slug,
        title: dto.title,
        metaDescription: dto.metaDescription,
        ogImageUrl: dto.ogImageUrl,
        themeId: dto.themeId,
        ...jsonFields,
      },
    });
  }

  async findOne(projectId: string, accountId: string) {
    await this.verifyProjectOwnership(projectId, accountId);

    const page = await this.prisma.hostedPage.findUnique({ where: { projectId } });
    if (!page) {
      throw new NotFoundException('Hosted page not found');
    }
    return page;
  }

  async update(projectId: string, accountId: string, dto: UpdateHostedPageDto) {
    await this.verifyProjectOwnership(projectId, accountId);

    const existing = await this.prisma.hostedPage.findUnique({ where: { projectId } });
    if (!existing) {
      throw new NotFoundException('Hosted page not found');
    }

    return this.prisma.hostedPage.update({
      where: { projectId },
      data: {
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.metaDescription !== undefined && { metaDescription: dto.metaDescription }),
        ...(dto.ogImageUrl !== undefined && { ogImageUrl: dto.ogImageUrl }),
        ...(dto.themeId !== undefined && { themeId: dto.themeId }),
        ...(dto.themeOverrides !== undefined && { themeOverrides: dto.themeOverrides as any }),
        ...(dto.sections !== undefined && { sections: dto.sections as any }),
        ...(dto.formConfig !== undefined && { formConfig: dto.formConfig as any }),
        ...(dto.successConfig !== undefined && { successConfig: dto.successConfig as any }),
      },
    });
  }

  async publish(projectId: string, accountId: string) {
    await this.verifyProjectOwnership(projectId, accountId);

    const existing = await this.prisma.hostedPage.findUnique({ where: { projectId } });
    if (!existing) {
      throw new NotFoundException('Hosted page not found');
    }

    return this.prisma.hostedPage.update({
      where: { projectId },
      data: {
        status: 'published',
        publishedAt: new Date(),
      },
    });
  }

  async unpublish(projectId: string, accountId: string) {
    await this.verifyProjectOwnership(projectId, accountId);

    const existing = await this.prisma.hostedPage.findUnique({ where: { projectId } });
    if (!existing) {
      throw new NotFoundException('Hosted page not found');
    }

    return this.prisma.hostedPage.update({
      where: { projectId },
      data: {
        status: 'draft',
        publishedAt: null,
      },
    });
  }
}
