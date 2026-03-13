import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

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
  ) {}

  async register(email: string, password: string, firstName?: string, lastName?: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new UnauthorizedException('Email already registered');
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
    const token = this.jwt.sign({ sub: user.id, accountId: user.accountId, roles: user.roles });
    return { user: { id: user.id, email: user.email, accountId: user.accountId, roles: user.roles }, token };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { account: true },
    });
    if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash)))
      throw new UnauthorizedException('Invalid credentials');
    const token = this.jwt.sign({ sub: user.id, accountId: user.accountId, roles: user.roles });
    return { user: { id: user.id, email: user.email, accountId: user.accountId, roles: user.roles }, token };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, firstName: true, lastName: true, roles: true,
        accountId: true, provider: true, avatarUrl: true,
        account: { select: { id: true, plan: true } },
      },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }

  async updateProfile(userId: string, dto: { firstName?: string; lastName?: string; email?: string }) {
    const data: Record<string, string> = {};
    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;
    if (dto.email !== undefined) {
      const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existing && existing.id !== userId) throw new BadRequestException('Email already in use');
      data.email = dto.email;
    }
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, firstName: true, lastName: true, roles: true, accountId: true },
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    if (!user.passwordHash) throw new BadRequestException('This account uses Google sign-in. Set a password from your profile settings.');
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Current password is incorrect');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { message: 'Password updated' };
  }

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
          provider: existingByEmail.provider === 'local' ? 'local' : existingByEmail.provider,
          avatarUrl: existingByEmail.avatarUrl || googleUser.picture || null,
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
