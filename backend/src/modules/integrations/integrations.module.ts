import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { WebhookDeliveryService } from './webhook-delivery.service';

@Module({
  controllers: [IntegrationsController],
  providers: [IntegrationsService, WebhookDeliveryService],
  exports: [IntegrationsService, WebhookDeliveryService],
})
export class IntegrationsModule {}
