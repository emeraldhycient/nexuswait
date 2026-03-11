import { IsString, IsOptional } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  name: string;

  @IsString()
  channel: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsString()
  body: string;
}
