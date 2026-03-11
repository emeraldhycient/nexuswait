import { Injectable, UnauthorizedException } from '@nestjs/common';
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
    const token = this.jwt.sign({ sub: user.id, accountId: user.accountId });
    return { user: { id: user.id, email: user.email, accountId: user.accountId }, token };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { account: true },
    });
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      throw new UnauthorizedException('Invalid credentials');
    const token = this.jwt.sign({ sub: user.id, accountId: user.accountId });
    return { user: { id: user.id, email: user.email, accountId: user.accountId }, token };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true, accountId: true, account: { select: { id: true, plan: true } } },
    });
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
