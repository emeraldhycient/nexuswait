import { IsString, IsOptional, IsUrl } from 'class-validator';

export class CreateCheckoutDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsString()
  @IsUrl()
  successUrl: string;

  @IsString()
  @IsUrl()
  cancelUrl: string;

  @IsOptional()
  @IsString()
  customerEmail?: string;
}
