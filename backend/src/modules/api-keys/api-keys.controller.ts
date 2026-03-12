import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtPayloadDecorator } from '../auth/jwt-payload.decorator';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { ApiKeysService } from './api-keys.service';

@Controller('api-keys')
@UseGuards(AuthGuard('jwt'))
export class ApiKeysController {
  constructor(private apiKeys: ApiKeysService) {}

  @Post()
  async create(
    @JwtPayloadDecorator() payload: { accountId: string },
    @Body() dto: CreateApiKeyDto,
  ) {
    return this.apiKeys.generate(payload.accountId, dto);
  }

  @Get()
  async list(@JwtPayloadDecorator() payload: { accountId: string }) {
    return this.apiKeys.listByAccount(payload.accountId);
  }

  @Delete(':id')
  async revoke(
    @Param('id') id: string,
    @JwtPayloadDecorator() payload: { accountId: string },
  ) {
    return this.apiKeys.revoke(id, payload.accountId);
  }
}
