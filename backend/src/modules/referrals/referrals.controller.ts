import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtPayloadDecorator } from '../auth/jwt-payload.decorator';
import { ReferralsService } from './referrals.service';

@Controller('projects/:projectId/referrals')
@UseGuards(AuthGuard('jwt'))
export class ReferralsController {
  constructor(private referrals: ReferralsService) {}

  @Get('leaderboard')
  async getLeaderboard(
    @Param('projectId') projectId: string,
    @JwtPayloadDecorator() payload: { accountId: string },
    @Query('limit') limit?: string,
  ) {
    return this.referrals.getLeaderboard(
      projectId,
      payload.accountId,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get()
  async findAll(
    @Param('projectId') projectId: string,
    @JwtPayloadDecorator() payload: { accountId: string },
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.referrals.findAll(
      projectId,
      payload.accountId,
      limit ? parseInt(limit, 10) : 20,
      cursor,
    );
  }
}
