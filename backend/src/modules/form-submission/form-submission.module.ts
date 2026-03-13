import { Module } from '@nestjs/common';
import { FormSubmissionController } from './form-submission.controller';
import { FormSubmissionService } from './form-submission.service';
import { SubscribersModule } from '../subscribers/subscribers.module';

@Module({
  imports: [SubscribersModule],
  controllers: [FormSubmissionController],
  providers: [FormSubmissionService],
})
export class FormSubmissionModule {}
