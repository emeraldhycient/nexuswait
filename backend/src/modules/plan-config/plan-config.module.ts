import { Module } from '@nestjs/common';
import { PlanConfigController } from './plan-config.controller';
import { PlanConfigService } from './plan-config.service';
import { PlanEnforcementService } from './plan-enforcement.service';

@Module({
  controllers: [PlanConfigController],
  providers: [PlanConfigService, PlanEnforcementService],
  exports: [PlanConfigService, PlanEnforcementService],
})
export class PlanConfigModule {}
