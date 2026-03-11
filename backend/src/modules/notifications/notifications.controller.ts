import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtPayloadDecorator } from '../auth/jwt-payload.decorator';
import { NotificationsService } from './notifications.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { EnqueueNotificationDto } from './dto/enqueue-notification.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get('templates')
  @UseGuards(AuthGuard('jwt'))
  async listTemplates(@JwtPayloadDecorator() payload: { accountId: string }) {
    return this.notifications.listTemplates(payload.accountId);
  }

  @Post('templates')
  @UseGuards(AuthGuard('jwt'))
  async createTemplate(
    @JwtPayloadDecorator() payload: { accountId: string },
    @Body() dto: CreateTemplateDto,
  ) {
    return this.notifications.createTemplate(payload.accountId, dto);
  }

  @Get('templates/:id')
  @UseGuards(AuthGuard('jwt'))
  async getTemplate(@Param('id') id: string) {
    return this.notifications.getTemplate(id);
  }

  @Patch('templates/:id')
  @UseGuards(AuthGuard('jwt'))
  async updateTemplate(@Param('id') id: string, @Body() dto: Partial<CreateTemplateDto>) {
    return this.notifications.updateTemplate(id, dto);
  }

  @Delete('templates/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteTemplate(@Param('id') id: string) {
    return this.notifications.deleteTemplate(id);
  }

  @Post('enqueue')
  @UseGuards(AuthGuard('jwt'))
  async enqueue(@Body() dto: EnqueueNotificationDto) {
    return this.notifications.enqueue(dto.templateId, dto.recipient, dto.payload || {});
  }
}
