import { Body, Controller, Get, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtPayloadDecorator } from '../auth/jwt-payload.decorator';
import { UpsertHostedPageDto } from './dto/upsert-hosted-page.dto';
import { UpdateHostedPageDto } from './dto/update-hosted-page.dto';
import { HostedPagesService } from './hosted-pages.service';

@Controller('projects/:projectId/page')
@UseGuards(AuthGuard('jwt'))
export class HostedPagesController {
  constructor(private hostedPages: HostedPagesService) {}

  @Get()
  async findOne(
    @Param('projectId') projectId: string,
    @JwtPayloadDecorator() payload: { accountId: string },
  ) {
    return this.hostedPages.findOne(projectId, payload.accountId);
  }

  @Put()
  async upsert(
    @Param('projectId') projectId: string,
    @JwtPayloadDecorator() payload: { accountId: string },
    @Body() dto: UpsertHostedPageDto,
  ) {
    return this.hostedPages.upsert(projectId, payload.accountId, dto);
  }

  @Patch()
  async update(
    @Param('projectId') projectId: string,
    @JwtPayloadDecorator() payload: { accountId: string },
    @Body() dto: UpdateHostedPageDto,
  ) {
    return this.hostedPages.update(projectId, payload.accountId, dto);
  }

  @Post('publish')
  async publish(
    @Param('projectId') projectId: string,
    @JwtPayloadDecorator() payload: { accountId: string },
  ) {
    return this.hostedPages.publish(projectId, payload.accountId);
  }

  @Post('unpublish')
  async unpublish(
    @Param('projectId') projectId: string,
    @JwtPayloadDecorator() payload: { accountId: string },
  ) {
    return this.hostedPages.unpublish(projectId, payload.accountId);
  }
}
