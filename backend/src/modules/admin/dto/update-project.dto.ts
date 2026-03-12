import { IsEnum, IsOptional } from 'class-validator';
import { ProjectStatus } from '../../../generated/prisma/client/enums';

export class UpdateProjectDto {
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;
}
