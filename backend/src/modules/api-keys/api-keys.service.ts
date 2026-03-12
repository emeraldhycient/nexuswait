import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { ApiKeyType } from '../../generated/prisma/client/enums';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@Injectable()
export class ApiKeysService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate a new API key, store its SHA-256 hash, and return the raw key once.
   */
  async generate(accountId: string, dto: CreateApiKeyDto) {
    const prefix =
      dto.type === ApiKeyType.secret ? 'nw_sk_live_' : 'nw_pk_live_';

    const rawRandom = randomBytes(24).toString('base64url');
    const rawKey = `${prefix}${rawRandom}`;

    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const displayPrefix = rawKey.substring(0, 16);

    const apiKey = await this.prisma.apiKey.create({
      data: {
        keyHash,
        prefix: displayPrefix,
        type: dto.type,
        projectId: dto.projectId ?? null,
        accountId,
      },
    });

    return {
      id: apiKey.id,
      key: rawKey,
      prefix: displayPrefix,
      type: apiKey.type,
      createdAt: apiKey.createdAt,
    };
  }

  /**
   * List all API keys for an account. Never returns the hash.
   */
  async listByAccount(accountId: string) {
    const keys = await this.prisma.apiKey.findMany({
      where: { accountId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        prefix: true,
        type: true,
        projectId: true,
        createdAt: true,
      },
    });
    return keys;
  }

  /**
   * Revoke (delete) an API key. Verifies account ownership before deletion.
   */
  async revoke(id: string, accountId: string) {
    const existing = await this.prisma.apiKey.findUnique({ where: { id } });
    if (!existing || existing.accountId !== accountId) {
      throw new NotFoundException('API key not found');
    }
    await this.prisma.apiKey.delete({ where: { id } });
    return { deleted: true };
  }

  /**
   * Validate a raw API key by hashing it and looking up the hash.
   * Returns the key record or null if not found.
   */
  async validateKey(rawKey: string) {
    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const apiKey = await this.prisma.apiKey.findFirst({
      where: { keyHash },
    });
    return apiKey ?? null;
  }
}
