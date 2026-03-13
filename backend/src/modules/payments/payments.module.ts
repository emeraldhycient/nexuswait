import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PolarSyncService } from './polar-sync.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, PolarSyncService],
  exports: [PaymentsService, PolarSyncService],
})
export class PaymentsModule {}
