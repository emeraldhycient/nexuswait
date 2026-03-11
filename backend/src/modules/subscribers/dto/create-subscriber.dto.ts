import { IsEmail, IsString, IsOptional, IsObject } from 'class-validator';

export class CreateSubscriberDto {
  @IsEmail()
  email: string;

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
