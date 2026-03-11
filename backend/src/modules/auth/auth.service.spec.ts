import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: jest.Mocked<PrismaService>;
  let jwt: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const mockPrisma = {
      user: { findUnique: jest.fn(), create: jest.fn() },
      account: { create: jest.fn() },
    };
    const mockJwt = { sign: jest.fn().mockReturnValue('mock-token') };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();
    service = module.get(AuthService);
    prisma = module.get(PrismaService);
    jwt = module.get(JwtService);
  });

  describe('register', () => {
    it('should throw if email already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: '1' });
      await expect(service.register('existing@test.com', 'password')).rejects.toThrow(UnauthorizedException);
    });

    it('should create account and user and return token', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.account.create as jest.Mock).mockResolvedValue({ id: 'acc-1' });
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'u1',
        email: 'new@test.com',
        accountId: 'acc-1',
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      const result = await service.register('new@test.com', 'password');
      expect(result.token).toBe('mock-token');
      expect(result.user.email).toBe('new@test.com');
      expect(prisma.account.create).toHaveBeenCalled();
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: 'new@test.com', passwordHash: 'hashed', accountId: 'acc-1' }),
        }),
      );
    });
  });

  describe('login', () => {
    it('should throw if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.login('x@test.com', 'pass')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw if password invalid', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ passwordHash: 'hashed' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.login('x@test.com', 'wrong')).rejects.toThrow(UnauthorizedException);
    });

    it('should return token on valid credentials', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'u1',
        email: 'x@test.com',
        accountId: 'acc-1',
        passwordHash: 'hashed',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const result = await service.login('x@test.com', 'pass');
      expect(result.token).toBe('mock-token');
      expect(result.user.email).toBe('x@test.com');
    });
  });
});
