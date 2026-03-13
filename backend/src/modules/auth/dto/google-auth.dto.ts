import { IsString } from 'class-validator';

export class GoogleAuthDto {
  @IsString()
  accessToken: string;
}
