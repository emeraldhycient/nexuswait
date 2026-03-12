import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../admin/guards/admin.guard';
import { PlatformConfigService } from './platform-config.service';
import { UpdatePlatformConfigDto } from './dto/update-platform-config.dto';

@Controller('config')
export class PlatformConfigController {
  constructor(private configService: PlatformConfigService) {}

  /** Public — no auth required. Embed snippets on end-user sites need this. */
  @Get()
  async getConfig() {
    return this.configService.getConfig();
  }
}

@Controller('admin/config')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class AdminPlatformConfigController {
  constructor(private configService: PlatformConfigService) {}

  @Get()
  async getConfig() {
    return this.configService.getConfig();
  }

  @Patch()
  async updateConfig(@Body() dto: UpdatePlatformConfigDto) {
    return this.configService.updateConfig(dto);
  }
}
