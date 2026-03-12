import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AdminGuard } from './admin.guard';

describe('AdminGuard', () => {
  let guard: AdminGuard;

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
    guard = new AdminGuard();
  });

  it('should return true when user.role is admin', () => {
    const context = createMockContext({
      user: { role: 'admin', sub: 'user-1' },
    });

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should throw ForbiddenException when user.role is not admin', () => {
    const context = createMockContext({
      user: { role: 'user', sub: 'user-1' },
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow(
      'Admin access required',
    );
  });

  it('should throw ForbiddenException when no user on request', () => {
    const context = createMockContext({});

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow(
      'Admin access required',
    );
  });
});
