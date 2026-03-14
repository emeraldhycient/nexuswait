import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AccountController } from './account.controller';
import { AuthService } from './auth.service';
import { EmailService } from './email.service';
import { JwtStrategy } from './jwt.strategy';
import { PlanConfigModule } from '../plan-config/plan-config.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: (() => {
          const s = config.get<string>('JWT_SECRET');
          if (!s) throw new Error('JWT_SECRET environment variable must be set');
          return s;
        })(),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN') || '7d' },
      }),
      inject: [ConfigService],
    }),
    PlanConfigModule,
  ],
  controllers: [AuthController, AccountController],
  providers: [AuthService, EmailService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
