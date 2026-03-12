import { PartialType } from '@nestjs/mapped-types';
import { UpsertHostedPageDto } from './upsert-hosted-page.dto';

export class UpdateHostedPageDto extends PartialType(UpsertHostedPageDto) {}
