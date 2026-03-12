import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  accountId: string;
  userId: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') || 'default-secret-change-in-production',
    });
  }

  validate(payload: { sub: string; accountId: string; role?: string }): JwtPayload {
    if (!payload.sub) throw new UnauthorizedException();
    return {
      sub: payload.sub,
      accountId: payload.accountId,
      userId: payload.sub,
      role: payload.role || 'user',
    };
  }
}
