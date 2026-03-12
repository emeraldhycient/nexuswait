import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtPayloadDecorator } from '../auth/jwt-payload.decorator';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';
import { UpdateSubscriberDto } from './dto/update-subscriber.dto';
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
    return this.subscribers.create(projectId, dto, ref);
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

  @Patch(':subId')
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('projectId') projectId: string,
    @Param('subId') subId: string,
    @JwtPayloadDecorator() payload: { accountId: string },
    @Body() dto: UpdateSubscriberDto,
  ) {
    return this.subscribers.update(projectId, subId, payload.accountId, dto);
  }

  @Delete(':subId')
  @UseGuards(AuthGuard('jwt'))
  async remove(
    @Param('projectId') projectId: string,
    @Param('subId') subId: string,
    @JwtPayloadDecorator() payload: { accountId: string },
  ) {
    return this.subscribers.remove(projectId, subId, payload.accountId);
  }
}
