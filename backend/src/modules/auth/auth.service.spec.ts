import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import { AuthService } from './auth.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

jest.mock('bcrypt');
jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AuthService', () => {
  let service: AuthService;
  let prisma: jest.Mocked<PrismaService>;
  let jwt: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const mockPrisma = {
      user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
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
        roles: ['user'],
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

    it('should throw if user has no passwordHash (Google-only account)', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'u1',
        email: 'google@test.com',
        passwordHash: null,
        roles: ['user'],
      });
      await expect(service.login('google@test.com', 'pass')).rejects.toThrow(UnauthorizedException);
    });

    it('should return token on valid credentials', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'u1',
        email: 'x@test.com',
        accountId: 'acc-1',
        passwordHash: 'hashed',
        roles: ['user'],
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const result = await service.login('x@test.com', 'pass');
      expect(result.token).toBe('mock-token');
      expect(result.user.email).toBe('x@test.com');
      expect(result.user.roles).toEqual(['user']);
    });
  });

  describe('googleAuth', () => {
    const googleUserInfo = {
      sub: 'google-123',
      email: 'google@test.com',
      given_name: 'Jane',
      family_name: 'Doe',
      picture: 'https://lh3.googleusercontent.com/photo.jpg',
    };

    it('should throw UnauthorizedException for invalid Google token', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Invalid token'));
      await expect(service.googleAuth('bad-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should return JWT for returning Google user (found by googleId)', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: googleUserInfo });
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'u1',
        email: 'google@test.com',
        accountId: 'acc-1',
        roles: ['user'],
        googleId: 'google-123',
      });

      const result = await service.googleAuth('valid-token');

      expect(result.token).toBe('mock-token');
      expect(result.user.email).toBe('google@test.com');
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should link Google account to existing email user', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: googleUserInfo });
      // First findUnique (by googleId) returns null
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      // Second findUnique (by email) returns existing user
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'u2',
        email: 'google@test.com',
        accountId: 'acc-2',
        roles: ['user'],
        provider: 'local',
        avatarUrl: null,
      });
      // update returns linked user
      (prisma.user.update as jest.Mock).mockResolvedValueOnce({
        id: 'u2',
        email: 'google@test.com',
        accountId: 'acc-2',
        roles: ['user'],
        googleId: 'google-123',
        provider: 'local',
        avatarUrl: 'https://lh3.googleusercontent.com/photo.jpg',
      });

      const result = await service.googleAuth('valid-token');

      expect(result.token).toBe('mock-token');
      expect(result.user.email).toBe('google@test.com');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u2' },
          data: expect.objectContaining({ googleId: 'google-123' }),
        }),
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should create new account + user for first-time Google sign-in', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: googleUserInfo });
      // Both findUnique calls return null
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      // Account creation
      (prisma.account.create as jest.Mock).mockResolvedValueOnce({ id: 'acc-new' });
      // User creation
      (prisma.user.create as jest.Mock).mockResolvedValueOnce({
        id: 'u-new',
        email: 'google@test.com',
        accountId: 'acc-new',
        roles: ['user'],
        googleId: 'google-123',
        provider: 'google',
      });

      const result = await service.googleAuth('valid-token');

      expect(result.token).toBe('mock-token');
      expect(result.user.email).toBe('google@test.com');
      expect(prisma.account.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { plan: 'spark' } }),
      );
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'google@test.com',
            googleId: 'google-123',
            provider: 'google',
            firstName: 'Jane',
            lastName: 'Doe',
            accountId: 'acc-new',
          }),
        }),
      );
    });
  });

  describe('changePassword', () => {
    it('should throw BadRequestException for Google-only user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'u1',
        passwordHash: null,
      });
      await expect(service.changePassword('u1', 'old', 'new')).rejects.toThrow(BadRequestException);
    });
  });
});
