import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(accountId: string, dto: CreateProjectDto) {
    const slug = dto.slug || dto.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return this.prisma.project.create({
      data: {
        name: dto.name,
        slug,
        accountId,
        redirectUrl: dto.redirectUrl,
        webhookUrl: dto.webhookUrl,
        customFields: dto.customFields as object[] | undefined,
      },
    });
  }

  async findAll(accountId: string) {
    return this.prisma.project.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { subscribers: true } } },
    });
  }

  async findOne(id: string, accountId?: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { _count: { select: { subscribers: true } } },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (accountId && project.accountId !== accountId) throw new NotFoundException('Project not found');
    return project;
  }

  async update(id: string, accountId: string, dto: Partial<CreateProjectDto>) {
    await this.findOne(id, accountId);
    return this.prisma.project.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.slug && { slug: dto.slug }),
        ...(dto.redirectUrl !== undefined && { redirectUrl: dto.redirectUrl }),
        ...(dto.webhookUrl !== undefined && { webhookUrl: dto.webhookUrl }),
        ...(dto.status && { status: dto.status }),
        ...(dto.customFields !== undefined && { customFields: dto.customFields as object[] }),
      },
    });
  }

  async remove(id: string, accountId: string) {
    await this.findOne(id, accountId);
    return this.prisma.project.update({
      where: { id },
      data: { status: 'archived' },
    });
  }
}
