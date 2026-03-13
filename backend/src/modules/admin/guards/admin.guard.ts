import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    if (!request.user?.userId) {
      throw new ForbiddenException('Admin access required');
    }

    // Check current DB roles instead of stale JWT roles
    const user = await this.prisma.user.findUnique({
      where: { id: request.user.userId },
      select: { roles: true },
    });

    if (!user || !user.roles?.includes('admin')) {
      throw new ForbiddenException('Admin access required');
    }

    // Update request.user.roles so downstream code has fresh roles
    request.user.roles = user.roles;
    return true;
  }
}
