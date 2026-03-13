import { IsEnum, IsString, IsObject, IsArray, IsOptional } from 'class-validator';
import { IntegrationType } from '../../../generated/prisma/client/enums';

export class CreateIntegrationDto {
  @IsEnum(IntegrationType)
  type: IntegrationType;

  @IsString()
  displayName: string;

  @IsOptional()
  @IsObject()
  config?: object;

  @IsOptional()
  @IsObject()
  fieldMapping?: object;

  @IsArray()
  @IsString({ each: true })
  events: string[];
}
