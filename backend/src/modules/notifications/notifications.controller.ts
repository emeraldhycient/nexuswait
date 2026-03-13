import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtPayloadDecorator } from '../auth/jwt-payload.decorator';
import { NotificationsService } from './notifications.service';
import { InAppNotificationService } from './in-app-notification.service';
import { NotificationPreferenceService } from './notification-preference.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { EnqueueNotificationDto } from './dto/enqueue-notification.dto';
import { CreatePreferenceDto } from './dto/create-preference.dto';
import { UpdatePreferenceDto } from './dto/update-preference.dto';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(
    private notifications: NotificationsService,
    private inApp: InAppNotificationService,
    private preferences: NotificationPreferenceService,
  ) {}

  /* ───── In-App Notifications ─────────────────────────── */

  @Get('inbox')
  async listInbox(
    @JwtPayloadDecorator() jwt: { accountId: string },
    @Query('unreadOnly') unreadOnly?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.inApp.findAll(jwt.accountId, {
      unreadOnly: unreadOnly === 'true',
      limit: limit ? parseInt(limit, 10) : 30,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }

  @Get('inbox/unread-count')
  async unreadCount(@JwtPayloadDecorator() jwt: { accountId: string }) {
    const count = await this.inApp.unreadCount(jwt.accountId);
    return { count };
  }

  @Patch('inbox/:id/read')
  async markRead(
    @JwtPayloadDecorator() jwt: { accountId: string },
    @Param('id') id: string,
  ) {
    await this.inApp.markRead(jwt.accountId, id);
    return { success: true };
  }

  @Post('inbox/read-all')
  async markAllRead(@JwtPayloadDecorator() jwt: { accountId: string }) {
    await this.inApp.markAllRead(jwt.accountId);
    return { success: true };
  }

  @Delete('inbox/:id')
  async removeInbox(
    @JwtPayloadDecorator() jwt: { accountId: string },
    @Param('id') id: string,
  ) {
    await this.inApp.remove(jwt.accountId, id);
    return { success: true };
  }

  /* ───── Notification Preferences ─────────────────────── */

  @Get('preferences')
  async listPreferences(@JwtPayloadDecorator() jwt: { accountId: string }) {
    return this.preferences.findAll(jwt.accountId);
  }

  @Post('preferences')
  async upsertPreference(
    @JwtPayloadDecorator() jwt: { accountId: string },
    @Body() dto: CreatePreferenceDto,
  ) {
    return this.preferences.upsert(jwt.accountId, dto);
  }

  @Patch('preferences/:id')
  async updatePreference(
    @JwtPayloadDecorator() jwt: { accountId: string },
    @Param('id') id: string,
    @Body() dto: UpdatePreferenceDto,
  ) {
    return this.preferences.update(jwt.accountId, id, dto);
  }

  @Delete('preferences/:id')
  async deletePreference(
    @JwtPayloadDecorator() jwt: { accountId: string },
    @Param('id') id: string,
  ) {
    return this.preferences.remove(jwt.accountId, id);
  }

  /* ───── Templates (existing) ─────────────────────────── */

  @Get('templates')
  async listTemplates(@JwtPayloadDecorator() jwt: { accountId: string }) {
    return this.notifications.listTemplates(jwt.accountId);
  }

  @Post('templates')
  async createTemplate(
    @JwtPayloadDecorator() jwt: { accountId: string },
    @Body() dto: CreateTemplateDto,
  ) {
    return this.notifications.createTemplate(jwt.accountId, dto);
  }

  @Get('templates/:id')
  async getTemplate(@Param('id') id: string) {
    return this.notifications.getTemplate(id);
  }

  @Patch('templates/:id')
  async updateTemplate(
    @Param('id') id: string,
    @Body() dto: Partial<CreateTemplateDto>,
  ) {
    return this.notifications.updateTemplate(id, dto);
  }

  @Delete('templates/:id')
  async deleteTemplate(@Param('id') id: string) {
    return this.notifications.deleteTemplate(id);
  }

  /* ───── Enqueue (existing) ───────────────────────────── */

  @Post('enqueue')
  async enqueue(@Body() dto: EnqueueNotificationDto) {
    return this.notifications.enqueue(dto.templateId, dto.recipient, dto.payload || {});
  }
}
