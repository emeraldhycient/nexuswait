import { IsString, IsInt, IsOptional, IsArray, IsBoolean, Min } from 'class-validator';

export class UpsertPlanConfigDto {
  @IsString()
  displayName: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @Min(0)
  monthlyPriceCents: number;

  @IsInt()
  @Min(0)
  yearlyPriceCents: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  maxProjects?: number | null;

  @IsInt()
  @Min(0)
  @IsOptional()
  maxSubscribersMonth?: number | null;

  @IsInt()
  @Min(0)
  @IsOptional()
  maxIntegrations?: number | null;

  @IsArray()
  @IsString({ each: true })
  features: string[];

  @IsString()
  @IsOptional()
  polarProductIdMonthly?: string;

  @IsString()
  @IsOptional()
  polarProductIdYearly?: string;

  @IsBoolean()
  @IsOptional()
  highlight?: boolean;

  @IsString()
  @IsOptional()
  ctaText?: string;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}
