import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiKeysService } from '../api-keys.service';

@Injectable()
export class CombinedAuthGuard implements CanActivate {
  private readonly jwtGuard: CanActivate;

  constructor(private apiKeysService: ApiKeysService) {
    // Instantiate the default Passport JWT guard for delegation
    this.jwtGuard = new (AuthGuard('jwt'))();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization format');
    }

    // If the token starts with "nw_", treat it as an API key
    if (token.startsWith('nw_')) {
      const apiKey = await this.apiKeysService.validateKey(token);
      if (!apiKey) {
        throw new UnauthorizedException('Invalid API key');
      }

      request.user = {
        sub: apiKey.accountId,
        accountId: apiKey.accountId,
        userId: null,
        role: 'user',
        apiKeyType: apiKey.type,
      };

      return true;
    }

    // Otherwise delegate to the standard JWT Passport guard
    return this.jwtGuard.canActivate(context) as Promise<boolean>;
  }
}
