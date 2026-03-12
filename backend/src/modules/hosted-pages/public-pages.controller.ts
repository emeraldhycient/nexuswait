import { Controller, Get, Param } from '@nestjs/common';
import { HostedPagesService } from './hosted-pages.service';

@Controller('pages')
export class PublicPagesController {
  constructor(private hostedPages: HostedPagesService) {}

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.hostedPages.findBySlug(slug);
  }
}
