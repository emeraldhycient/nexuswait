import { IsString, IsOptional } from 'class-validator';

export class CreateCheckoutDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  successUrl?: string;

  @IsOptional()
  @IsString()
  cancelUrl?: string;

  @IsOptional()
  @IsString()
  customerEmail?: string;
}
