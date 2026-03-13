import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

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
    const token = this.jwt.sign({ sub: user.id, accountId: user.accountId, role: user.role });
    return { user: { id: user.id, email: user.email, accountId: user.accountId, role: user.role }, token };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { account: true },
    });
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      throw new UnauthorizedException('Invalid credentials');
    const token = this.jwt.sign({ sub: user.id, accountId: user.accountId, role: user.role });
    return { user: { id: user.id, email: user.email, accountId: user.accountId, role: user.role }, token };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, firstName: true, lastName: true, role: true,
        accountId: true, account: { select: { id: true, plan: true } },
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
      select: { id: true, email: true, firstName: true, lastName: true, role: true, accountId: true },
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Current password is incorrect');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { message: 'Password updated' };
  }
}
