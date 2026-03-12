import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtPayloadDecorator } from '../auth/jwt-payload.decorator';
import { AnalyticsService } from './analytics.service';

@Controller('projects/:projectId/analytics')
@UseGuards(AuthGuard('jwt'))
export class AnalyticsController {
  constructor(private analytics: AnalyticsService) {}

  @Get('overview')
  async getOverview(
    @Param('projectId') projectId: string,
    @JwtPayloadDecorator() payload: { accountId: string },
  ) {
    return this.analytics.getOverview(projectId, payload.accountId);
  }

  @Get('timeseries')
  async getTimeseries(
    @Param('projectId') projectId: string,
    @JwtPayloadDecorator() payload: { accountId: string },
    @Query('period') period?: string,
    @Query('granularity') granularity?: string,
  ) {
    return this.analytics.getTimeseries(
      projectId,
      payload.accountId,
      period || '7d',
      granularity || 'day',
    );
  }

  @Get('sources')
  async getSources(
    @Param('projectId') projectId: string,
    @JwtPayloadDecorator() payload: { accountId: string },
  ) {
    return this.analytics.getSources(projectId, payload.accountId);
  }
}
