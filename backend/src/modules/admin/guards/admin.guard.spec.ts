import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

describe('AdminGuard', () => {
  let guard: AdminGuard;
  let prisma: { user: { findUnique: jest.Mock } };

  function createMockContext(
    request: { user?: unknown },
  ): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    prisma = { user: { findUnique: jest.fn() } };
    guard = new AdminGuard(prisma as unknown as PrismaService);
  });

  it('should return true when DB roles include admin', async () => {
    prisma.user.findUnique.mockResolvedValue({ roles: ['admin'] });
    const request = { user: { userId: 'user-1', roles: ['user'] } };
    const context = createMockContext(request);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.user.roles).toEqual(['admin']);
  });

  it('should return true when DB has multiple roles including admin', async () => {
    prisma.user.findUnique.mockResolvedValue({ roles: ['user', 'admin'] });
    const request = { user: { userId: 'user-1', roles: ['user'] } };
    const context = createMockContext(request);

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(request.user.roles).toEqual(['user', 'admin']);
  });

  it('should throw ForbiddenException when DB roles do not include admin', async () => {
    prisma.user.findUnique.mockResolvedValue({ roles: ['user'] });
    const context = createMockContext({
      user: { userId: 'user-1', roles: ['user'] },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(context)).rejects.toThrow('Admin access required');
  });

  it('should throw ForbiddenException when no user on request', async () => {
    const context = createMockContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(context)).rejects.toThrow('Admin access required');
  });

  it('should throw ForbiddenException when user not found in DB', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    const context = createMockContext({
      user: { userId: 'nonexistent', roles: ['admin'] },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});
