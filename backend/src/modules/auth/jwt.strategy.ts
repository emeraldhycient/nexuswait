import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  accountId: string;
  userId: string;
  roles: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: (() => {
        const s = config.get<string>('JWT_SECRET');
        if (!s) throw new Error('JWT_SECRET environment variable must be set');
        return s;
      })(),
    });
  }

  /** Accept both `roles` (new) and `role` (legacy) for backward compatibility with existing JWTs */
  validate(payload: { sub: string; accountId: string; role?: string; roles?: string[] }): JwtPayload {
    if (!payload.sub) throw new UnauthorizedException();
    return {
      sub: payload.sub,
      accountId: payload.accountId,
      userId: payload.sub,
      roles: payload.roles || (payload.role ? [payload.role] : ['user']),
    };
  }
}
