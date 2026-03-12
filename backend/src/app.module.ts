import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TerminusModule } from '@nestjs/terminus';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { HealthController } from './presentation/health/health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { SubscribersModule } from './modules/subscribers/subscribers.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { HostedPagesModule } from './modules/hosted-pages/hosted-pages.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ReferralsModule } from './modules/referrals/referrals.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { AdminModule } from './modules/admin/admin.module';
import { PlatformConfigModule } from './modules/platform-config/platform-config.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    TerminusModule,
    PrismaModule,
    AuthModule,
    ProjectsModule,
    SubscribersModule,
    NotificationsModule,
    PaymentsModule,
    ApiKeysModule,
    HostedPagesModule,
    AnalyticsModule,
    ReferralsModule,
    IntegrationsModule,
    AdminModule,
    PlatformConfigModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
