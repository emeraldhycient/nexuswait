import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateIntegrationDto } from './create-integration.dto';

export class UpdateIntegrationDto extends PartialType(CreateIntegrationDto) {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
