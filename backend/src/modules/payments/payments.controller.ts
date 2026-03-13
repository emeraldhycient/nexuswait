import { Body, Controller, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { JwtPayloadDecorator } from '../auth/jwt-payload.decorator';
import { PaymentsService } from './payments.service';
import { PolarSyncService } from './polar-sync.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

@Controller('payments')
export class PaymentsController {
  constructor(
    private payments: PaymentsService,
    private polarSync: PolarSyncService,
  ) {}

  @Post('checkout/session')
  @UseGuards(AuthGuard('jwt'))
  async createCheckoutSession(
    @JwtPayloadDecorator() payload: { accountId: string },
    @Body() dto: CreateCheckoutDto,
  ) {
    const productId = dto.productId || process.env.POLAR_PRODUCT_ID_PULSE || '';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const successUrl = dto.successUrl || `${frontendUrl}/dashboard/settings?billing=1&checkout=success`;
    const cancelUrl = dto.cancelUrl || `${frontendUrl}/dashboard/settings?billing=1&checkout=cancelled`;
    return this.payments.createCheckoutSession(
      payload.accountId,
      productId,
      successUrl,
      cancelUrl,
      dto.customerEmail,
    );
  }

  @Post('cancel')
  @UseGuards(AuthGuard('jwt'))
  async cancelSubscription(
    @JwtPayloadDecorator() payload: { accountId: string },
  ) {
    return this.payments.cancelSubscription(payload.accountId);
  }

  @Post('sync-products')
  @UseGuards(AuthGuard('jwt'))
  async syncProducts() {
    return this.polarSync.syncProducts();
  }

  @Post('webhooks/polar')
  async polarWebhook(@Body() body: Record<string, unknown>, @Req() req: Request) {
    const signature = req.headers['x-polar-signature'] as string;
    const rawBody = (req as any).rawBody as Buffer;

    if (rawBody && !this.payments.verifyWebhookSignature(rawBody, signature)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    await this.payments.handlePolarWebhook(body);
    return { received: true };
  }
}
