import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';
import { CombinedAuthGuard } from './guards/combined-auth.guard';

@Module({
  imports: [AuthModule],
  controllers: [ApiKeysController],
  providers: [ApiKeysService, CombinedAuthGuard],
  exports: [ApiKeysService, CombinedAuthGuard],
})
export class ApiKeysModule {}
