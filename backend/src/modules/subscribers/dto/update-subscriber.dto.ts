import { IsString, IsOptional, IsObject, IsEmail } from 'class-validator';

export class UpdateSubscriberDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  source?: string;
}
