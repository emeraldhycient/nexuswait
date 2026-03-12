import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ApiKeysService } from '../api-keys.service';
import { ApiKeyType } from '../../../generated/prisma/client/enums';

// Mock AuthGuard before importing the guard under test
const mockJwtCanActivate = jest.fn();

jest.mock('@nestjs/passport', () => ({
  AuthGuard: () => {
    return class MockJwtGuard {
      canActivate = mockJwtCanActivate;
    };
  },
}));

// Import after mock is set up
import { CombinedAuthGuard } from './combined-auth.guard';

describe('CombinedAuthGuard', () => {
  let guard: CombinedAuthGuard;
  let apiKeysService: jest.Mocked<ApiKeysService>;
  let mockRequest: { headers: Record<string, string>; user?: unknown };

  function createMockContext(
    request: typeof mockRequest,
  ): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    apiKeysService = {
      validateKey: jest.fn(),
    } as unknown as jest.Mocked<ApiKeysService>;

    guard = new CombinedAuthGuard(apiKeysService);

    mockRequest = { headers: {} };
    mockJwtCanActivate.mockReset();
  });

  it('should throw UnauthorizedException when no auth header', async () => {
    const context = createMockContext(mockRequest);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
    await expect(guard.canActivate(context)).rejects.toThrow(
      'Missing authorization header',
    );
  });

  it('should throw UnauthorizedException when invalid format (no Bearer)', async () => {
    mockRequest.headers.authorization = 'Basic some-token';
    const context = createMockContext(mockRequest);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
    await expect(guard.canActivate(context)).rejects.toThrow(
      'Invalid authorization format',
    );
  });

  it('should validate API key and set request.user when token starts with nw_', async () => {
    const mockApiKey = {
      id: 'key-1',
      accountId: 'acc-1',
      type: ApiKeyType.secret,
      keyHash: 'hash',
      prefix: 'nw_sk_live_XXXX',
      projectId: null,
      createdAt: new Date(),
    };

    mockRequest.headers.authorization = 'Bearer nw_sk_live_abc123';
    apiKeysService.validateKey.mockResolvedValue(mockApiKey);

    const context = createMockContext(mockRequest);
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(apiKeysService.validateKey).toHaveBeenCalledWith(
      'nw_sk_live_abc123',
    );
    expect(mockRequest.user).toEqual({
      sub: 'acc-1',
      accountId: 'acc-1',
      userId: null,
      role: 'user',
      apiKeyType: ApiKeyType.secret,
    });
  });

  it('should throw UnauthorizedException when API key is invalid', async () => {
    mockRequest.headers.authorization = 'Bearer nw_sk_live_badkey';
    apiKeysService.validateKey.mockResolvedValue(null);

    const context = createMockContext(mockRequest);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
    await expect(guard.canActivate(context)).rejects.toThrow(
      'Invalid API key',
    );
  });

  it('should delegate to JWT guard for non-nw_ tokens', async () => {
    mockRequest.headers.authorization = 'Bearer eyJhbGciOiJIUzI1NiJ9.test';
    mockJwtCanActivate.mockResolvedValue(true);

    const context = createMockContext(mockRequest);
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockJwtCanActivate).toHaveBeenCalledWith(context);
    expect(apiKeysService.validateKey).not.toHaveBeenCalled();
  });
});
