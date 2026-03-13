import { Controller, Get } from '@nestjs/common';
import { PlanConfigService } from './plan-config.service';

@Controller('plans')
export class PlanConfigController {
  constructor(private planConfigService: PlanConfigService) {}

  /** Public endpoint — used by Pricing page */
  @Get()
  async getAll() {
    return this.planConfigService.getAll();
  }
}
