import { IsArray, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../../../generated/prisma/client/enums';

export class AdminUpdateUserDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[];
}
