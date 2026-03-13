import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdatePreferenceDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  channels?: string[];

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
