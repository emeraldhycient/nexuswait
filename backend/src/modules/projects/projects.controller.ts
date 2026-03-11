import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtPayloadDecorator } from '../auth/jwt-payload.decorator';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectsService } from './projects.service';

@Controller('projects')
@UseGuards(AuthGuard('jwt'))
export class ProjectsController {
  constructor(private projects: ProjectsService) {}

  @Post()
  async create(@JwtPayloadDecorator() payload: { accountId: string }, @Body() dto: CreateProjectDto) {
    return this.projects.create(payload.accountId, dto);
  }

  @Get()
  async findAll(@JwtPayloadDecorator() payload: { accountId: string }) {
    return this.projects.findAll(payload.accountId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @JwtPayloadDecorator() payload: { accountId: string }) {
    return this.projects.findOne(id, payload.accountId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @JwtPayloadDecorator() payload: { accountId: string },
    @Body() dto: Partial<CreateProjectDto>,
  ) {
    return this.projects.update(id, payload.accountId, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @JwtPayloadDecorator() payload: { accountId: string }) {
    return this.projects.remove(id, payload.accountId);
  }
}
