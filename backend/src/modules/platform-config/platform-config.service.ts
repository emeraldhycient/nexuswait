import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { UpdatePlatformConfigDto } from './dto/update-platform-config.dto';

const SINGLETON_ID = 'singleton';

const DEFAULTS = {
  id: SINGLETON_ID,
  apiBaseUrl: 'https://api.nexuswait.io',
  cdnBaseUrl: 'https://cdn.nexuswait.io',
};

@Injectable()
export class PlatformConfigService {
  constructor(private prisma: PrismaService) {}

  async getConfig() {
    const config = await this.prisma.platformConfig.findUnique({
      where: { id: SINGLETON_ID },
    });
    return config ?? DEFAULTS;
  }

  async updateConfig(dto: UpdatePlatformConfigDto) {
    const data: Record<string, string> = {};
    if (dto.apiBaseUrl !== undefined) data.apiBaseUrl = dto.apiBaseUrl;
    if (dto.cdnBaseUrl !== undefined) data.cdnBaseUrl = dto.cdnBaseUrl;

    return this.prisma.platformConfig.upsert({
      where: { id: SINGLETON_ID },
      update: data,
      create: {
        ...DEFAULTS,
        ...data,
      },
    });
  }
}
