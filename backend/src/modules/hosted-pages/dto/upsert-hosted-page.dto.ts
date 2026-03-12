import { IsString, IsOptional, IsObject, IsArray, MinLength, MaxLength } from 'class-validator';

export class UpsertHostedPageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  slug: string;

  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  @IsOptional()
  @IsString()
  ogImageUrl?: string;

  @IsString()
  themeId: string;

  @IsOptional()
  @IsObject()
  themeOverrides?: Record<string, unknown>;

  @IsArray()
  sections: Record<string, unknown>[];

  @IsObject()
  formConfig: Record<string, unknown>;

  @IsObject()
  successConfig: Record<string, unknown>;
}
