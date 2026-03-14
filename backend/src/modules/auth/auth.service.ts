import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { EmailService } from './email.service';

interface GoogleUserInfo {
  sub: string;
  email: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private emailService: EmailService,
  ) {}

  // ─── Helpers ───────────────────────────────────────────────

  private generateVerificationToken(userId: string, email: string): string {
    const secret = this.config.get<string>('EMAIL_VERIFICATION_SECRET');
    return this.jwt.sign(
      { sub: userId, email, purpose: 'email-verification' },
      { secret, expiresIn: '24h' },
    );
  }

  private buildVerificationUrl(token: string): string {
    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    return `${frontendUrl}/verify-email?token=${token}`;
  }

  // ─── Register ──────────────────────────────────────────────

  async register(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
  ) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new UnauthorizedException(
        'Email already registered. If you haven\u2019t verified it yet, check your email or request a new verification link.',
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const account = await this.prisma.account.create({
      data: { plan: 'spark' },
    });
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        accountId: account.id,
      },
      include: { account: true },
    });

    // Send verification email
    const token = this.generateVerificationToken(user.id, user.email);
    const verificationUrl = this.buildVerificationUrl(token);
    await this.emailService.sendVerificationEmail(user.email, verificationUrl);

    return {
      message:
        'Registration successful. Please check your email to verify your account.',
      requiresVerification: true,
      email: user.email,
    };
  }

  // ─── Login ─────────────────────────────────────────────────

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { account: true },
    });
    if (
      !user ||
      !user.passwordHash ||
      !(await bcrypt.compare(password, user.passwordHash))
    )
      throw new UnauthorizedException('Invalid credentials');

    // Block unverified local users
    if (!user.emailVerifiedAt && user.provider === 'local') {
      throw new UnauthorizedException({
        message: 'Please verify your email before signing in.',
        code: 'EMAIL_NOT_VERIFIED',
        email: user.email,
      });
    }

    const token = this.jwt.sign({
      sub: user.id,
      accountId: user.accountId,
      roles: user.roles,
    });
    return {
      user: {
        id: user.id,
        email: user.email,
        accountId: user.accountId,
        roles: user.roles,
      },
      token,
    };
  }

  // ─── Me ────────────────────────────────────────────────────

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        roles: true,
        accountId: true,
        provider: true,
        avatarUrl: true,
        emailVerifiedAt: true,
        account: { select: { id: true, plan: true } },
      },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }

  // ─── Update Profile ────────────────────────────────────────

  async updateProfile(
    userId: string,
    dto: { firstName?: string; lastName?: string; email?: string },
  ) {
    const data: Record<string, string> = {};
    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;
    if (dto.email !== undefined) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing && existing.id !== userId)
        throw new BadRequestException('Email already in use');
      data.email = dto.email;
    }
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        roles: true,
        accountId: true,
      },
    });
  }

  // ─── Change Password ──────────────────────────────────────

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    if (!user.passwordHash)
      throw new BadRequestException(
        'This account uses Google sign-in. Set a password from your profile settings.',
      );
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Current password is incorrect');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    return { message: 'Password updated' };
  }

  // ─── Verify Email ─────────────────────────────────────────

  async verifyEmail(token: string) {
    const secret = this.config.get<string>('EMAIL_VERIFICATION_SECRET');
    let payload: { sub: string; email: string; purpose: string };

    try {
      payload = this.jwt.verify(token, { secret });
    } catch (err: unknown) {
      const error = err as { name?: string };
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException({
          message: 'Verification link has expired. Please request a new one.',
          code: 'TOKEN_EXPIRED',
        });
      }
      throw new BadRequestException('Invalid verification token.');
    }

    if (payload.purpose !== 'email-verification') {
      throw new BadRequestException('Invalid verification token.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { account: true },
    });

    if (!user) throw new BadRequestException('User not found.');

    // Already verified — still return a JWT so user can proceed
    if (user.emailVerifiedAt) {
      const sessionToken = this.jwt.sign({
        sub: user.id,
        accountId: user.accountId,
        roles: user.roles,
      });
      return {
        message: 'Email already verified.',
        alreadyVerified: true,
        token: sessionToken,
        user: {
          id: user.id,
          email: user.email,
          accountId: user.accountId,
          roles: user.roles,
        },
      };
    }

    // Validate email matches token claim
    if (user.email !== payload.email) {
      throw new BadRequestException(
        'Email mismatch. Please request a new verification email.',
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
    });

    const sessionToken = this.jwt.sign({
      sub: user.id,
      accountId: user.accountId,
      roles: user.roles,
    });

    return {
      message: 'Email verified successfully.',
      token: sessionToken,
      user: {
        id: user.id,
        email: user.email,
        accountId: user.accountId,
        roles: user.roles,
      },
    };
  }

  // ─── Resend Verification Email ────────────────────────────

  async resendVerificationEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Return generic message to prevent email enumeration
    if (!user) {
      return {
        message:
          'If an account exists with that email, a verification email has been sent.',
      };
    }

    if (user.emailVerifiedAt) {
      return { message: 'Email is already verified. You can sign in.' };
    }

    const token = this.generateVerificationToken(user.id, user.email);
    const verificationUrl = this.buildVerificationUrl(token);
    await this.emailService.sendVerificationEmail(user.email, verificationUrl);

    return {
      message:
        'If an account exists with that email, a verification email has been sent.',
    };
  }

  // ─── Google OAuth ─────────────────────────────────────────

  async googleAuth(accessToken: string) {
    // 1. Verify the access token with Google
    let googleUser: GoogleUserInfo;
    try {
      const { data } = await axios.get<GoogleUserInfo>(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      googleUser = data;
    } catch {
      throw new UnauthorizedException('Invalid Google token');
    }

    if (!googleUser.email) {
      throw new UnauthorizedException('Google account has no email');
    }

    // 2. Fast path — returning Google user (found by googleId)
    const existingByGoogleId = await this.prisma.user.findUnique({
      where: { googleId: googleUser.sub },
      include: { account: true },
    });

    if (existingByGoogleId) {
      const token = this.jwt.sign({
        sub: existingByGoogleId.id,
        accountId: existingByGoogleId.accountId,
        roles: existingByGoogleId.roles,
      });
      return {
        user: {
          id: existingByGoogleId.id,
          email: existingByGoogleId.email,
          accountId: existingByGoogleId.accountId,
          roles: existingByGoogleId.roles,
        },
        token,
      };
    }

    // 3. Link path — existing email user, link Google account
    const existingByEmail = await this.prisma.user.findUnique({
      where: { email: googleUser.email },
      include: { account: true },
    });

    if (existingByEmail) {
      const updated = await this.prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          googleId: googleUser.sub,
          provider:
            existingByEmail.provider === 'local'
              ? 'local'
              : existingByEmail.provider,
          avatarUrl: existingByEmail.avatarUrl || googleUser.picture || null,
          // Auto-verify email for Google-linked accounts
          emailVerifiedAt: existingByEmail.emailVerifiedAt || new Date(),
        },
        include: { account: true },
      });
      const token = this.jwt.sign({
        sub: updated.id,
        accountId: updated.accountId,
        roles: updated.roles,
      });
      return {
        user: {
          id: updated.id,
          email: updated.email,
          accountId: updated.accountId,
          roles: updated.roles,
        },
        token,
      };
    }

    // 4. New user path — create Account + User
    const account = await this.prisma.account.create({
      data: { plan: 'spark' },
    });
    const user = await this.prisma.user.create({
      data: {
        email: googleUser.email,
        googleId: googleUser.sub,
        provider: 'google',
        firstName: googleUser.given_name || null,
        lastName: googleUser.family_name || null,
        avatarUrl: googleUser.picture || null,
        accountId: account.id,
        emailVerifiedAt: new Date(),
      },
      include: { account: true },
    });
    const token = this.jwt.sign({
      sub: user.id,
      accountId: user.accountId,
      roles: user.roles,
    });
    return {
      user: {
        id: user.id,
        email: user.email,
        accountId: user.accountId,
        roles: user.roles,
      },
      token,
    };
  }
}
