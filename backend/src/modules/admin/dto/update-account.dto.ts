import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { PlanTier } from '../../../generated/prisma/client/enums';

export class UpdateAccountDto {
  @IsEnum(PlanTier)
  @IsOptional()
  plan?: PlanTier;

  @IsBoolean()
  @IsOptional()
  suspended?: boolean;
}
