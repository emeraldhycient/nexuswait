import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiKeyType } from '../../../generated/prisma/client/enums';

export class CreateApiKeyDto {
  @IsEnum(ApiKeyType)
  type: ApiKeyType;

  @IsOptional()
  @IsString()
  projectId?: string;
}
