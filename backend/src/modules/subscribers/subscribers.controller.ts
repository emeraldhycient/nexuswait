import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
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
    @Query('search') search?: string,
    @Query('source') source?: string,
    @Query('sort') sort?: string,
  ) {
    return this.subscribers.findAll(projectId, payload.accountId, {
      limit: limit ? parseInt(limit, 10) : 20,
      cursor,
      search,
      source,
      sort,
    });
  }

  @Get('count')
  async getCount(@Param('projectId') projectId: string) {
    return { count: await this.subscribers.getCount(projectId) };
  }

  @Get('export')
  @UseGuards(AuthGuard('jwt'))
  async exportAll(
    @Param('projectId') projectId: string,
    @JwtPayloadDecorator() payload: { accountId: string },
    @Res() res: Response,
    @Query('search') search?: string,
    @Query('source') source?: string,
  ) {
    const subscribers = await this.subscribers.exportAll(projectId, payload.accountId, { search, source });

    // Build CSV
    const header = 'Position,Name,Email,Source,Referrals,Referral Code,Referred By,Signed Up';
    const rows = subscribers.map((sub: any, index: number) => {
      const position = index + 1;
      const name = this.escapeCsv(sub.name ?? '');
      const email = this.escapeCsv(sub.email);
      const source = this.escapeCsv(sub.source ?? '');
      const referrals = sub._count?.referred ?? 0;
      const referralCode = sub.referralCode ?? '';
      const referredBy = sub.referrer?.email ?? '';
      const signedUp = sub.createdAt ? new Date(sub.createdAt).toISOString() : '';
      return `${position},${name},${email},${source},${referrals},${referralCode},${this.escapeCsv(referredBy)},${signedUp}`;
    });
    const csv = [header, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="subscribers-${projectId}.csv"`);
    res.send(csv);
  }

  private escapeCsv(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
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
