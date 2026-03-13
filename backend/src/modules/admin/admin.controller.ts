import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from './guards/admin.guard';
import { AdminService } from './admin.service';
import { UpdateAccountDto } from './dto/update-account.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PlanTier, ProjectStatus } from '../../generated/prisma/client/enums';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ──────────────────────────────────────────────
  //  Stats
  // ──────────────────────────────────────────────

  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }

  // ──────────────────────────────────────────────
  //  Accounts
  // ──────────────────────────────────────────────

  @Get('accounts')
  async getAccounts(
    @Query('search') search?: string,
    @Query('plan') plan?: PlanTier,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.adminService.getAccounts({ search, plan, page, limit });
  }

  @Get('accounts/:id')
  async getAccount(@Param('id') id: string) {
    return this.adminService.getAccount(id);
  }

  @Patch('accounts/:id')
  async updateAccount(
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.adminService.updateAccount(id, dto);
  }

  // ──────────────────────────────────────────────
  //  Projects
  // ──────────────────────────────────────────────

  @Get('projects')
  async getProjects(
    @Query('search') search?: string,
    @Query('status') status?: ProjectStatus,
    @Query('accountId') accountId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.adminService.getProjects({
      search,
      status,
      accountId,
      page,
      limit,
    });
  }

  @Patch('projects/:id')
  async updateProject(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.adminService.updateProject(id, dto);
  }

  // ──────────────────────────────────────────────
  //  Subscribers
  // ──────────────────────────────────────────────

  @Get('subscribers/recent')
  async getRecentSubscribers(
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
  ) {
    return this.adminService.getRecentSubscribers(limit);
  }

  @Get('subscribers/flagged')
  async getFlaggedSubscribers() {
    return this.adminService.getFlaggedSubscribers();
  }

  // ──────────────────────────────────────────────
  //  Integrations
  // ──────────────────────────────────────────────

  @Get('integrations/health')
  async getIntegrationHealth() {
    return this.adminService.getIntegrationHealth();
  }

  @Get('integrations/failed')
  async getFailedIntegrations() {
    return this.adminService.getFailedIntegrations();
  }

  @Post('integrations/:id/retry')
  async retryIntegration(@Param('id') id: string) {
    return this.adminService.retryIntegration(id);
  }

  // ──────────────────────────────────────────────
  //  Notifications
  // ──────────────────────────────────────────────

  @Get('notifications/queue')
  async getNotificationQueue() {
    return this.adminService.getNotificationQueue();
  }

  @Get('notifications/templates')
  async getNotificationTemplates() {
    return this.adminService.getNotificationTemplates();
  }

  // ──────────────────────────────────────────────
  //  Global Search
  // ──────────────────────────────────────────────

  @Get('search')
  async globalSearch(@Query('q') q: string) {
    return this.adminService.globalSearch(q);
  }

  // ──────────────────────────────────────────────
  //  System
  // ──────────────────────────────────────────────

  @Get('system')
  async getSystemHealth() {
    return this.adminService.getSystemHealth();
  }
}
