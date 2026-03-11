import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtPayloadDecorator } from '../auth/jwt-payload.decorator';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';
import { SubscribersService } from './subscribers.service';

@Controller('projects/:projectId/subscribers')
export class SubscribersController {
  constructor(private subscribers: SubscribersService) {}

  @Post()
  async create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateSubscriberDto,
    @Query('ref') ref?: string,
  ) {
    // TODO: resolve ref to referrerId when using API key / publishable key
    return this.subscribers.create(projectId, dto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(
    @Param('projectId') projectId: string,
    @JwtPayloadDecorator() payload: { accountId: string },
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.subscribers.findAll(projectId, payload.accountId, limit ? parseInt(limit, 10) : 20, cursor);
  }

  @Get('count')
  async getCount(@Param('projectId') projectId: string) {
    return { count: await this.subscribers.getCount(projectId) };
  }

  @Get(':subId')
  @UseGuards(AuthGuard('jwt'))
  async findOne(
    @Param('projectId') projectId: string,
    @Param('subId') subId: string,
    @JwtPayloadDecorator() payload: { accountId: string },
  ) {
    return this.subscribers.findOne(projectId, subId, payload.accountId);
  }
}
