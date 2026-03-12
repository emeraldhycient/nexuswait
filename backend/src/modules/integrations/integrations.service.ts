import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateIntegrationDto } from './dto/create-integration.dto';
import { UpdateIntegrationDto } from './dto/update-integration.dto';
import { WebhookDeliveryService } from './webhook-delivery.service';

@Injectable()
export class IntegrationsService {
  constructor(
    private prisma: PrismaService,
    private webhookDelivery: WebhookDeliveryService,
  ) {}

  private async verifyOwnership(projectId: string, accountId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.accountId !== accountId) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  async create(projectId: string, accountId: string, dto: CreateIntegrationDto) {
    await this.verifyOwnership(projectId, accountId);
    return this.prisma.integration.create({
      data: {
        projectId,
        type: dto.type,
        displayName: dto.displayName,
        config: dto.config,
        fieldMapping: dto.fieldMapping ?? undefined,
        events: dto.events,
      },
    });
  }

  async findAll(projectId: string, accountId: string) {
    await this.verifyOwnership(projectId, accountId);
    return this.prisma.integration.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(projectId: string, integrationId: string, accountId: string) {
    await this.verifyOwnership(projectId, accountId);
    const integration = await this.prisma.integration.findFirst({
      where: { id: integrationId, projectId },
    });
    if (!integration) throw new NotFoundException('Integration not found');
    return integration;
  }

  async update(projectId: string, integrationId: string, accountId: string, dto: UpdateIntegrationDto) {
    await this.verifyOwnership(projectId, accountId);
    const existing = await this.prisma.integration.findFirst({
      where: { id: integrationId, projectId },
    });
    if (!existing) throw new NotFoundException('Integration not found');
    return this.prisma.integration.update({
      where: { id: integrationId },
      data: {
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.displayName !== undefined && { displayName: dto.displayName }),
        ...(dto.config !== undefined && { config: dto.config }),
        ...(dto.fieldMapping !== undefined && { fieldMapping: dto.fieldMapping }),
        ...(dto.events !== undefined && { events: dto.events }),
        ...(dto.enabled !== undefined && { enabled: dto.enabled }),
      },
    });
  }

  async remove(projectId: string, integrationId: string, accountId: string) {
    await this.verifyOwnership(projectId, accountId);
    const existing = await this.prisma.integration.findFirst({
      where: { id: integrationId, projectId },
    });
    if (!existing) throw new NotFoundException('Integration not found');
    return this.prisma.integration.delete({
      where: { id: integrationId },
    });
  }

  async test(projectId: string, integrationId: string, accountId: string) {
    await this.verifyOwnership(projectId, accountId);
    const integration = await this.prisma.integration.findFirst({
      where: { id: integrationId, projectId },
    });
    if (!integration) throw new NotFoundException('Integration not found');
    await this.webhookDelivery.deliverTest(integration);
    return { success: true };
  }
}
