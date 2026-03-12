import { IsString, IsOptional, IsEnum, IsArray, MinLength, MaxLength } from 'class-validator';
import { ProjectStatus } from '../../../generated/prisma/client/enums';

export class CreateProjectDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  slug?: string;

  @IsOptional()
  @IsString()
  redirectUrl?: string;

  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsArray()
  customFields?: Record<string, unknown>[];
}
