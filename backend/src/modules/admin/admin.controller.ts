import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from './guards/admin.guard';
import { AdminService } from './admin.service';
import { UpdateAccountDto } from './dto/update-account.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { AdminResetPasswordDto } from './dto/admin-reset-password.dto';
import { PlanTier, ProjectStatus, UserRole } from '../../generated/prisma/client/enums';
import { PlanConfigService } from '../plan-config/plan-config.service';
import { UpsertPlanConfigDto } from '../plan-config/dto/upsert-plan-config.dto';
import { JwtPayloadDecorator } from '../auth/jwt-payload.decorator';
import { JwtPayload } from '../auth/jwt.strategy';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class AdminController {
  constructor(
    private adminService: AdminService,
    private planConfigService: PlanConfigService,
  ) {}

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
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.adminService.getAccounts({ search, plan, page, limit, sortBy, sortOrder });
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

  @Get('accounts/:id/subscribers')
  async getAccountSubscribers(
    @Param('id') id: string,
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.adminService.getAccountSubscribers(id, { search, page, limit, sortBy, sortOrder });
  }

  // ──────────────────────────────────────────────
  //  Users
  // ──────────────────────────────────────────────

  @Get('users')
  async getUsers(
    @Query('search') search?: string,
    @Query('role') role?: UserRole,
    @Query('accountId') accountId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.adminService.getUsers({ search, role, accountId, page, limit, sortBy, sortOrder });
  }

  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    return this.adminService.getUser(id);
  }

  @Patch('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() dto: AdminUpdateUserDto,
    @JwtPayloadDecorator() jwt: JwtPayload,
  ) {
    return this.adminService.updateUser(id, dto, jwt.userId);
  }

  @Delete('users/:id')
  async deleteUser(
    @Param('id') id: string,
    @JwtPayloadDecorator() jwt: JwtPayload,
  ) {
    return this.adminService.deleteUser(id, jwt.userId);
  }

  @Post('users/:id/reset-password')
  async resetPassword(
    @Param('id') id: string,
    @Body() dto: AdminResetPasswordDto,
  ) {
    return this.adminService.resetUserPassword(id, dto.temporaryPassword);
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
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.adminService.getProjects({
      search,
      status,
      accountId,
      page,
      limit,
      sortBy,
      sortOrder,
    });
  }

  @Get('projects/:id')
  async getProject(@Param('id') id: string) {
    return this.adminService.getProject(id);
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

  @Get('subscribers')
  async getSubscribers(
    @Query('search') search?: string,
    @Query('source') source?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.adminService.getSubscribers({ search, source, page, limit, sortBy, sortOrder });
  }

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
  async getFailedIntegrations(
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('paginated') paginated?: string,
  ) {
    // When paginated=true, return paginated response; otherwise keep legacy array response
    if (paginated === 'true') {
      return this.adminService.getFailedIntegrationsPaginated({ search, page, limit, sortBy, sortOrder });
    }
    return this.adminService.getFailedIntegrations();
  }

  @Post('integrations/:id/retry')
  async retryIntegration(@Param('id') id: string) {
    return this.adminService.retryIntegration(id);
  }

  @Get('integrations/:id/delivery-logs')
  async getDeliveryLogs(
    @Param('id') integrationId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.adminService.getDeliveryLogs(integrationId, page, limit, sortBy, sortOrder);
  }

  @Patch('integrations/:id/config')
  async updateIntegrationConfig(
    @Param('id') id: string,
    @Body() body: { maxRetryAttempts?: number },
  ) {
    return this.adminService.updateIntegrationConfig(id, body);
  }

  // ──────────────────────────────────────────────
  //  Delivery logs retrigger
  // ──────────────────────────────────────────────

  @Post('delivery-logs/:logId/retrigger')
  async retriggerDelivery(@Param('logId') logId: string) {
    return this.adminService.retriggerDelivery(logId);
  }

  // ──────────────────────────────────────────────
  //  Webhook events (incoming Polar audit)
  // ──────────────────────────────────────────────

  @Get('webhook-events')
  async getWebhookEvents(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.adminService.getWebhookEvents(page, limit, sortBy, sortOrder);
  }

  // ──────────────────────────────────────────────
  //  Notifications
  // ──────────────────────────────────────────────

  @Get('notifications/failed')
  async getFailedNotifications(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.adminService.getFailedNotifications({ page, limit });
  }

  @Get('notifications/queue')
  async getNotificationQueue() {
    return this.adminService.getNotificationQueue();
  }

  @Get('notifications/templates')
  async getNotificationTemplates() {
    return this.adminService.getNotificationTemplates();
  }

  // ──────────────────────────────────────────────
  //  Plans (admin CRUD)
  // ──────────────────────────────────────────────

  @Get('plans')
  async getPlans() {
    return this.planConfigService.getAll();
  }

  @Put('plans/:tier')
  async upsertPlan(
    @Param('tier') tier: PlanTier,
    @Body() dto: UpsertPlanConfigDto,
  ) {
    return this.planConfigService.upsert(tier, dto);
  }

  @Delete('plans/:tier')
  async deletePlan(@Param('tier') tier: PlanTier) {
    return this.planConfigService.delete(tier);
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
