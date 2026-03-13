import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { NotificationStatus } from '../../generated/prisma/client/enums';
import { CreateTemplateDto } from './dto/create-template.dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async createTemplate(accountId: string | null, dto: CreateTemplateDto) {
    return this.prisma.notificationTemplate.create({
      data: {
        name: dto.name,
        channel: dto.channel,
        subject: dto.subject,
        body: dto.body,
        accountId,
      },
    });
  }

  async listTemplates(accountId?: string | null) {
    return this.prisma.notificationTemplate.findMany({
      where: accountId ? { accountId } : { accountId: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTemplate(id: string, accountId?: string) {
    const t = await this.prisma.notificationTemplate.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Template not found');
    if (accountId && t.accountId !== accountId) throw new NotFoundException('Template not found');
    return t;
  }

  async updateTemplate(id: string, dto: Partial<CreateTemplateDto>, accountId?: string) {
    await this.getTemplate(id, accountId);
    return this.prisma.notificationTemplate.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.channel && { channel: dto.channel }),
        ...(dto.subject !== undefined && { subject: dto.subject }),
        ...(dto.body && { body: dto.body }),
      },
    });
  }

  async deleteTemplate(id: string, accountId?: string) {
    await this.getTemplate(id, accountId);
    return this.prisma.notificationTemplate.delete({ where: { id } });
  }

  async enqueue(templateId: string, recipient: string, payload: Record<string, unknown>, accountId?: string) {
    const template = await this.prisma.notificationTemplate.findUnique({ where: { id: templateId } });
    if (!template) throw new NotFoundException('Template not found');
    if (accountId && template.accountId !== accountId) throw new NotFoundException('Template not found');
    const nextRetryAt = new Date(Date.now() + 1000); // 1s first retry
    return this.prisma.notification.create({
      data: {
        templateId,
        recipient,
        payload: payload as object,
        status: NotificationStatus.pending,
        attempts: 0,
        maxAttempts: 3,
        nextRetryAt,
      },
    });
  }
}
