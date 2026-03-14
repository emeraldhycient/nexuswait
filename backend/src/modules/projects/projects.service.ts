import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { PlanEnforcementService } from '../plan-config/plan-enforcement.service';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private planEnforcement: PlanEnforcementService,
  ) {}

  private async ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug;
    let suffix = 2;
    while (true) {
      const existing = await this.prisma.project.findUnique({ where: { slug } });
      if (!existing || existing.id === excludeId) return slug;
      slug = `${baseSlug}-${suffix++}`;
    }
  }

  async create(accountId: string, dto: CreateProjectDto) {
    await this.planEnforcement.checkProjectLimit(accountId);
    const baseSlug = dto.slug || dto.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const slug = await this.ensureUniqueSlug(baseSlug);
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
      where: { accountId, status: { not: 'archived' } },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { subscribers: true } } },
    });
  }

  async findAllPaginated(accountId: string, params: {
    search?: string; status?: string;
    page?: number; limit?: number;
    sortBy?: string; sortOrder?: string;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 15));
    const skip = (page - 1) * limit;

    const allowedSort = ['createdAt', 'name', 'status'];
    const sortField = allowedSort.includes(params.sortBy ?? '') ? params.sortBy! : 'createdAt';
    const sortDir: 'asc' | 'desc' = params.sortOrder === 'asc' ? 'asc' : 'desc';

    const where: Record<string, unknown> = { accountId, status: { not: 'archived' } };
    if (params.search) where.name = { contains: params.search, mode: 'insensitive' };
    if (params.status) where.status = params.status;

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        orderBy: { [sortField]: sortDir },
        skip,
        take: limit,
        include: { _count: { select: { subscribers: true } } },
      }),
      this.prisma.project.count({ where }),
    ]);

    return { data, total, page, limit };
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
    let slug: string | undefined;
    if (dto.slug) {
      slug = await this.ensureUniqueSlug(dto.slug, id);
    }
    return this.prisma.project.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(slug && { slug }),
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

  async search(accountId: string, q: string) {
    if (!q || q.length < 2) return { projects: [], subscribers: [], integrations: [] };

    const [projects, subscribers, integrations] = await Promise.all([
      this.prisma.project.findMany({
        where: {
          accountId,
          status: { not: 'archived' },
          name: { contains: q, mode: 'insensitive' },
        },
        take: 5,
        select: { id: true, name: true, status: true },
      }),
      this.prisma.subscriber.findMany({
        where: {
          project: { accountId },
          OR: [
            { email: { contains: q, mode: 'insensitive' } },
            { name: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, email: true, name: true, projectId: true },
      }),
      this.prisma.integration.findMany({
        where: {
          project: { accountId },
          displayName: { contains: q, mode: 'insensitive' },
        },
        take: 5,
        select: { id: true, displayName: true, type: true, projectId: true },
      }),
    ]);

    return { projects, subscribers, integrations };
  }
}
