import { Body, Controller, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { JwtPayloadDecorator } from '../auth/jwt-payload.decorator';
import { PaymentsService } from './payments.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  @Post('checkout/session')
  @UseGuards(AuthGuard('jwt'))
  async createCheckoutSession(
    @JwtPayloadDecorator() payload: { accountId: string },
    @Body() dto: CreateCheckoutDto,
  ) {
    const productId = dto.productId || process.env.POLAR_PRODUCT_ID_PULSE || '';
    return this.payments.createCheckoutSession(
      payload.accountId,
      productId,
      dto.successUrl,
      dto.cancelUrl,
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
