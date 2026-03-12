import { Module } from '@nestjs/common';
import {
  PlatformConfigController,
  AdminPlatformConfigController,
} from './platform-config.controller';
import { PlatformConfigService } from './platform-config.service';

@Module({
  controllers: [PlatformConfigController, AdminPlatformConfigController],
  providers: [PlatformConfigService],
  exports: [PlatformConfigService],
})
export class PlatformConfigModule {}
