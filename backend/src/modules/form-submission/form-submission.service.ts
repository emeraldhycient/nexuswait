import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateSubscriberDto } from '../subscribers/dto/create-subscriber.dto';

@Injectable()
export class FormSubmissionService {
  constructor(private prisma: PrismaService) {}

  async findActiveProjectBySlug(slug: string) {
    const project = await this.prisma.project.findUnique({
      where: { slug },
    });
    if (!project || project.status !== 'active') {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  mapFormBodyToDto(body: Record<string, unknown>): CreateSubscriberDto {
    const dto = new CreateSubscriberDto();
    dto.email = String(body.email || '');
    if (body.name) dto.name = String(body.name);
    dto.source = 'form';

    // Pack any extra fields into metadata
    const reserved = new Set(['email', 'name', '_hp']);
    const metadata: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (!reserved.has(key) && value !== undefined && value !== '') {
        metadata[key] = value;
      }
    }
    if (Object.keys(metadata).length > 0) {
      dto.metadata = metadata;
    }

    return dto;
  }

  buildRedirectUrl(
    project: { redirectUrl: string | null },
    params: Record<string, string>,
  ): string {
    const base = project.redirectUrl || '/v1/s/success';
    const url = new URL(base, 'http://placeholder');
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    // If redirectUrl is absolute, return full URL; otherwise return path + query
    if (project.redirectUrl && /^https?:\/\//.test(project.redirectUrl)) {
      return url.toString();
    }
    return `${url.pathname}${url.search}`;
  }
}
