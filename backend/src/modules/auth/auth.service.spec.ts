import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import { AuthService } from './auth.service';
import { EmailService } from './email.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

jest.mock('bcrypt');
jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AuthService', () => {
  let service: AuthService;
  let prisma: jest.Mocked<PrismaService>;
  let jwt: jest.Mocked<JwtService>;
  let emailService: jest.Mocked<EmailService>;

  beforeEach(async () => {
    const mockPrisma = {
      user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
      account: { create: jest.fn() },
    };
    const mockJwt = {
      sign: jest.fn().mockReturnValue('mock-token'),
      verify: jest.fn(),
    };
    const mockConfig = {
      get: jest.fn((key: string) => {
        const map: Record<string, string> = {
          EMAIL_VERIFICATION_SECRET: 'test-verify-secret',
          FRONTEND_URL: 'http://localhost:5173',
          RESEND_API_KEY: 'test-key',
          EMAIL_FROM: 'test@nexuswait.com',
        };
        return map[key];
      }),
    };
    const mockEmailService = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();
    service = module.get(AuthService);
    prisma = module.get(PrismaService);
    jwt = module.get(JwtService);
    emailService = module.get(EmailService);
  });

  describe('register', () => {
    it('should throw if email already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: '1' });
      await expect(service.register('existing@test.com', 'password')).rejects.toThrow(UnauthorizedException);
    });

    it('should create account and user and return requiresVerification', async () => {
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
      expect(result.requiresVerification).toBe(true);
      expect(result.email).toBe('new@test.com');
      expect(result).not.toHaveProperty('token');
      expect(prisma.account.create).toHaveBeenCalled();
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: 'new@test.com', passwordHash: 'hashed', accountId: 'acc-1' }),
        }),
      );
    });

    it('should send verification email after registration', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.account.create as jest.Mock).mockResolvedValue({ id: 'acc-1' });
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'u1',
        email: 'new@test.com',
        accountId: 'acc-1',
        roles: ['user'],
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      await service.register('new@test.com', 'password');
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        'new@test.com',
        expect.stringContaining('http://localhost:5173/verify-email?token='),
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

    it('should throw EMAIL_NOT_VERIFIED for unverified local user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'u1',
        email: 'unverified@test.com',
        accountId: 'acc-1',
        passwordHash: 'hashed',
        roles: ['user'],
        provider: 'local',
        emailVerifiedAt: null,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      try {
        await service.login('unverified@test.com', 'pass');
        fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(UnauthorizedException);
        expect((err as UnauthorizedException).getResponse()).toEqual(
          expect.objectContaining({ code: 'EMAIL_NOT_VERIFIED' }),
        );
      }
    });

    it('should return token for verified local user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'u1',
        email: 'x@test.com',
        accountId: 'acc-1',
        passwordHash: 'hashed',
        roles: ['user'],
        provider: 'local',
        emailVerifiedAt: new Date(),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const result = await service.login('x@test.com', 'pass');
      expect(result.token).toBe('mock-token');
      expect(result.user.email).toBe('x@test.com');
      expect(result.user.roles).toEqual(['user']);
    });
  });

  describe('verifyEmail', () => {
    it('should verify a valid token and return a session JWT', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({
        sub: 'u1',
        email: 'test@test.com',
        purpose: 'email-verification',
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'u1',
        email: 'test@test.com',
        accountId: 'acc-1',
        roles: ['user'],
        emailVerifiedAt: null,
      });
      (prisma.user.update as jest.Mock).mockResolvedValue({});
      const result = await service.verifyEmail('valid-token');
      expect(result.token).toBe('mock-token');
      expect(result.message).toContain('verified');
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u1' },
          data: { emailVerifiedAt: expect.any(Date) },
        }),
      );
    });

    it('should throw TOKEN_EXPIRED for an expired token', async () => {
      const expiredError = new Error('Token expired');
      expiredError.name = 'TokenExpiredError';
      (jwt.verify as jest.Mock).mockImplementation(() => { throw expiredError; });
      try {
        await service.verifyEmail('expired-token');
        fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        expect((err as BadRequestException).getResponse()).toEqual(
          expect.objectContaining({ code: 'TOKEN_EXPIRED' }),
        );
      }
    });

    it('should throw for a token with wrong purpose', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({
        sub: 'u1',
        email: 'test@test.com',
        purpose: 'session',
      });
      await expect(service.verifyEmail('wrong-purpose')).rejects.toThrow(BadRequestException);
    });

    it('should handle already-verified user gracefully', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({
        sub: 'u1',
        email: 'test@test.com',
        purpose: 'email-verification',
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'u1',
        email: 'test@test.com',
        accountId: 'acc-1',
        roles: ['user'],
        emailVerifiedAt: new Date(),
      });
      const result = await service.verifyEmail('valid-token');
      expect(result.alreadyVerified).toBe(true);
      expect(result.token).toBe('mock-token');
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should throw for email mismatch between token and user', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({
        sub: 'u1',
        email: 'old@test.com',
        purpose: 'email-verification',
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'u1',
        email: 'changed@test.com',
        accountId: 'acc-1',
        roles: ['user'],
        emailVerifiedAt: null,
      });
      await expect(service.verifyEmail('mismatch-token')).rejects.toThrow(BadRequestException);
    });
  });

  describe('resendVerificationEmail', () => {
    it('should send email for an unverified user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'u1',
        email: 'unverified@test.com',
        emailVerifiedAt: null,
      });
      const result = await service.resendVerificationEmail('unverified@test.com');
      expect(result.message).toBeTruthy();
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        'unverified@test.com',
        expect.stringContaining('http://localhost:5173/verify-email?token='),
      );
    });

    it('should return success even for non-existent email (no enumeration)', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      const result = await service.resendVerificationEmail('noexist@test.com');
      expect(result.message).toBeTruthy();
      expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('should return already verified message for verified user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'u1',
        email: 'verified@test.com',
        emailVerifiedAt: new Date(),
      });
      const result = await service.resendVerificationEmail('verified@test.com');
      expect(result.message).toContain('already verified');
      expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
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

    it('should link Google account to existing email user and auto-verify', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: googleUserInfo });
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'u2',
        email: 'google@test.com',
        accountId: 'acc-2',
        roles: ['user'],
        provider: 'local',
        avatarUrl: null,
        emailVerifiedAt: null,
      });
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
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'u2' },
          data: expect.objectContaining({
            googleId: 'google-123',
            emailVerifiedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should create new user with emailVerifiedAt set for Google sign-in', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: googleUserInfo });
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null);
      (prisma.account.create as jest.Mock).mockResolvedValueOnce({ id: 'acc-new' });
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
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'google@test.com',
            googleId: 'google-123',
            provider: 'google',
            emailVerifiedAt: expect.any(Date),
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
