import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreatePreferenceDto {
  @IsString()
  event: string;

  @IsArray()
  @IsString({ each: true })
  channels: string[];

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
