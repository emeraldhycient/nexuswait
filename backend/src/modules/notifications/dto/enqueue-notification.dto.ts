import { IsString, IsObject, IsOptional } from 'class-validator';

export class EnqueueNotificationDto {
  @IsString()
  templateId: string;

  @IsString()
  recipient: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
