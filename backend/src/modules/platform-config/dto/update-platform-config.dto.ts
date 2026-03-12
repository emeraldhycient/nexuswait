import { IsOptional, IsUrl } from 'class-validator';

export class UpdatePlatformConfigDto {
  @IsUrl({ require_tld: false })
  @IsOptional()
  apiBaseUrl?: string;

  @IsUrl({ require_tld: false })
  @IsOptional()
  cdnBaseUrl?: string;
}
