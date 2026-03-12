import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtPayloadDecorator } from '../auth/jwt-payload.decorator';
import { CreateIntegrationDto } from './dto/create-integration.dto';
import { UpdateIntegrationDto } from './dto/update-integration.dto';
import { IntegrationsService } from './integrations.service';

@Controller('projects/:projectId/integrations')
@UseGuards(AuthGuard('jwt'))
export class IntegrationsController {
  constructor(private integrations: IntegrationsService) {}

  @Post()
  async create(
    @Param('projectId') projectId: string,
    @JwtPayloadDecorator() payload: { accountId: string },
    @Body() dto: CreateIntegrationDto,
  ) {
    return this.integrations.create(projectId, payload.accountId, dto);
  }

  @Get()
  async findAll(
    @Param('projectId') projectId: string,
    @JwtPayloadDecorator() payload: { accountId: string },
  ) {
    return this.integrations.findAll(projectId, payload.accountId);
  }

  @Get(':integrationId')
  async findOne(
    @Param('projectId') projectId: string,
    @Param('integrationId') integrationId: string,
    @JwtPayloadDecorator() payload: { accountId: string },
  ) {
    return this.integrations.findOne(projectId, integrationId, payload.accountId);
  }

  @Patch(':integrationId')
  async update(
    @Param('projectId') projectId: string,
    @Param('integrationId') integrationId: string,
    @JwtPayloadDecorator() payload: { accountId: string },
    @Body() dto: UpdateIntegrationDto,
  ) {
    return this.integrations.update(projectId, integrationId, payload.accountId, dto);
  }

  @Delete(':integrationId')
  async remove(
    @Param('projectId') projectId: string,
    @Param('integrationId') integrationId: string,
    @JwtPayloadDecorator() payload: { accountId: string },
  ) {
    return this.integrations.remove(projectId, integrationId, payload.accountId);
  }

  @Post(':integrationId/test')
  async test(
    @Param('projectId') projectId: string,
    @Param('integrationId') integrationId: string,
    @JwtPayloadDecorator() payload: { accountId: string },
  ) {
    return this.integrations.test(projectId, integrationId, payload.accountId);
  }
}
