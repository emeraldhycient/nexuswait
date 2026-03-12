import { Module } from '@nestjs/common';
import { HostedPagesController } from './hosted-pages.controller';
import { HostedPagesService } from './hosted-pages.service';

@Module({
  controllers: [HostedPagesController],
  providers: [HostedPagesService],
  exports: [HostedPagesService],
})
export class HostedPagesModule {}
