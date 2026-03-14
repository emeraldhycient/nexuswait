import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreatePreferenceDto } from './dto/create-preference.dto';
import { UpdatePreferenceDto } from './dto/update-preference.dto';

/** All known events and their default channels */
export const DEFAULT_PREFERENCES: { event: string; label: string; channels: string[] }[] = [
  { event: 'waitlist.signup.created', label: 'New waitlist signup', channels: ['in_app'] },
  { event: 'integration.webhook.failed', label: 'Webhook delivery failure', channels: ['in_app', 'email'] },
  { event: 'project.created', label: 'Project created', channels: ['in_app'] },
  { event: 'project.archived', label: 'Project archived', channels: ['in_app'] },
  { event: 'integration.created', label: 'Integration connected', channels: ['in_app'] },
  { event: 'integration.removed', label: 'Integration removed', channels: ['in_app'] },
  { event: 'subscription.upgraded', label: 'Plan upgraded', channels: ['in_app', 'email'] },
  { event: 'subscription.cancelled', label: 'Subscription cancelled', channels: ['in_app', 'email'] },
  { event: 'subscriber.milestone', label: 'Subscriber milestone reached', channels: ['in_app', 'email'] },
  { event: 'api-key.created', label: 'API key generated', channels: ['in_app'] },
  { event: 'api-key.revoked', label: 'API key revoked', channels: ['in_app'] },
  { event: 'hosted-page.published', label: 'Hosted page published', channels: ['in_app'] },
];

@Injectable()
export class NotificationPreferenceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Returns all preferences for an account, filling in defaults
   * for any events that don't have an explicit preference yet.
   */
  async findAll(accountId: string) {
    const saved = await this.prisma.notificationPreference.findMany({
      where: { accountId },
      orderBy: { createdAt: 'asc' },
    });

    const savedMap = new Map(saved.map((p) => [p.event, p]));

    return DEFAULT_PREFERENCES.map((def) => {
      const existing = savedMap.get(def.event);
      return {
        id: existing?.id ?? null,
        event: def.event,
        label: def.label,
        channels: existing?.channels ?? def.channels,
        enabled: existing?.enabled ?? true,
      };
    });
  }

  async upsert(accountId: string, dto: CreatePreferenceDto) {
    return this.prisma.notificationPreference.upsert({
      where: {
        accountId_event: { accountId, event: dto.event },
      },
      create: {
        accountId,
        event: dto.event,
        channels: dto.channels,
        enabled: dto.enabled ?? true,
      },
      update: {
        channels: dto.channels,
        enabled: dto.enabled ?? true,
      },
    });
  }

  async update(accountId: string, id: string, dto: UpdatePreferenceDto) {
    const pref = await this.prisma.notificationPreference.findFirst({
      where: { id, accountId },
    });
    if (!pref) throw new NotFoundException('Preference not found');

    return this.prisma.notificationPreference.update({
      where: { id },
      data: {
        ...(dto.channels !== undefined && { channels: dto.channels }),
        ...(dto.enabled !== undefined && { enabled: dto.enabled }),
      },
    });
  }

  async remove(accountId: string, id: string) {
    const pref = await this.prisma.notificationPreference.findFirst({
      where: { id, accountId },
    });
    if (!pref) throw new NotFoundException('Preference not found');

    return this.prisma.notificationPreference.delete({ where: { id } });
  }
}
