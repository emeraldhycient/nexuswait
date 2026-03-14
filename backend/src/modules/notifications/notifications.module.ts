import { Module } from '@nestjs/common';
import { IntegrationsModule } from '../integrations/integrations.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationWorkerService } from './notification-worker.service';
import { InAppNotificationService } from './in-app-notification.service';
import { EmailNotificationService } from './email-notification.service';
import { NotificationPreferenceService } from './notification-preference.service';
import { NotificationTemplateSeederService } from './notification-template-seeder.service';
import { RetryService } from './retry.service';

@Module({
  imports: [IntegrationsModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationWorkerService,
    InAppNotificationService,
    EmailNotificationService,
    NotificationPreferenceService,
    NotificationTemplateSeederService,
    RetryService,
  ],
  exports: [NotificationsService, InAppNotificationService],
})
export class NotificationsModule {}
