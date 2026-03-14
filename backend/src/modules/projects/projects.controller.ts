import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
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

  @Get('paginated')
  async findAllPaginated(
    @JwtPayloadDecorator() payload: { accountId: string },
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    return this.projects.findAllPaginated(payload.accountId, {
      search,
      status,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      sortBy,
      sortOrder,
    });
  }

  // Must be above :id route to avoid "search" being matched as an ID
  @Get('search/all')
  async search(
    @JwtPayloadDecorator() payload: { accountId: string },
    @Query('q') q: string,
  ) {
    return this.projects.search(payload.accountId, q);
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
