import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  Req,
  Res,
  Header,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { FormSubmissionService } from './form-submission.service';
import { SubscribersService } from '../subscribers/subscribers.service';

@Controller('s')
export class FormSubmissionController {
  constructor(
    private formService: FormSubmissionService,
    private subscribers: SubscribersService,
  ) {}

  @Post(':slug')
  @Header('Access-Control-Allow-Origin', '*')
  @Header('Access-Control-Allow-Methods', 'POST, OPTIONS')
  @Header('Access-Control-Allow-Headers', 'Content-Type')
  async submit(
    @Param('slug') slug: string,
    @Req() req: Request,
    @Res() res: Response,
    @Query('ref') ref?: string,
  ) {
    const isFormSubmission =
      req.headers['content-type']?.includes('application/x-www-form-urlencoded') ?? false;

    try {
      // 1. Find active project by slug
      const project = await this.formService.findActiveProjectBySlug(slug);

      // 2. Honeypot check — silently redirect to success if bot fills hidden field
      const body = req.body as Record<string, unknown>;
      if (body._hp && String(body._hp).trim() !== '') {
        if (isFormSubmission) {
          const redirectUrl = this.formService.buildRedirectUrl(project, {
            status: 'success',
          });
          return res.redirect(HttpStatus.FOUND, redirectUrl);
        }
        return res.json({ success: true });
      }

      // 3. Map form body to DTO
      const dto = this.formService.mapFormBodyToDto(body);

      // 4. Create subscriber via existing service
      const subscriber = await this.subscribers.create(project.id, dto, ref);

      // 5. Respond based on content type
      if (isFormSubmission) {
        const redirectUrl = this.formService.buildRedirectUrl(project, {
          status: 'success',
          email: subscriber.email,
          ref_code: subscriber.referralCode,
        });
        return res.redirect(HttpStatus.FOUND, redirectUrl);
      }

      return res.json({
        success: true,
        subscriber: {
          email: subscriber.email,
          referralCode: subscriber.referralCode,
        },
      });
    } catch (error: unknown) {
      const err = error as { message?: string; status?: number };
      const message = err.message || 'An error occurred';
      const errorCode = this.mapErrorToCode(message);

      if (isFormSubmission) {
        try {
          const project = await this.formService.findActiveProjectBySlug(slug);
          const redirectUrl = this.formService.buildRedirectUrl(project, {
            status: 'error',
            error: errorCode,
            message,
          });
          return res.redirect(HttpStatus.FOUND, redirectUrl);
        } catch {
          // Project not found — redirect to default success page with error
          return res.redirect(
            HttpStatus.FOUND,
            `/v1/s/success?status=error&error=${errorCode}&message=${encodeURIComponent(message)}`,
          );
        }
      }

      const statusCode = err.status || HttpStatus.BAD_REQUEST;
      return res.status(statusCode).json({
        success: false,
        error: errorCode,
        message,
      });
    }
  }

  @Get('success')
  @Header('Content-Type', 'text/html')
  successPage(
    @Query('status') status?: string,
    @Query('email') email?: string,
    @Query('error') error?: string,
    @Query('message') message?: string,
  ) {
    const isError = status === 'error';
    const safeEmail = email ? this.escapeHtml(email) : '';
    const safeMessage = message ? this.escapeHtml(message) : '';

    const errorMessages: Record<string, string> = {
      already_subscribed: 'This email is already on the waitlist.',
      validation_error: safeMessage || 'Please check your submission and try again.',
      limit_reached: 'This waitlist is currently full. Please try again later.',
    };

    const title = isError ? 'Oops!' : "You're on the list!";
    const subtitle = isError
      ? errorMessages[error || ''] || safeMessage || 'Something went wrong. Please try again.'
      : safeEmail
        ? `We've added <strong>${safeEmail}</strong> to the waitlist.`
        : "You've been added to the waitlist.";
    const accentColor = isError ? '#ff2daa' : '#00e8ff';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — NexusWait</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#06060c;color:#ddddf0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
    .card{text-align:center;max-width:420px;padding:48px 32px;border-radius:16px;background:rgba(14,14,24,0.8);border:1px solid rgba(0,232,255,0.06)}
    h1{font-size:28px;font-weight:800;margin-bottom:12px;color:${accentColor}}
    p{font-size:15px;color:#7878a0;line-height:1.6}
    p strong{color:#ababca}
    .icon{font-size:48px;margin-bottom:16px}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${isError ? '&#9888;' : '&#10003;'}</div>
    <h1>${title}</h1>
    <p>${subtitle}</p>
  </div>
</body>
</html>`;
  }

  private mapErrorToCode(message: string): string {
    if (message.includes('Unique constraint') || message.includes('already exists')) {
      return 'already_subscribed';
    }
    if (message.includes('Missing required fields') || message.includes('Validation')) {
      return 'validation_error';
    }
    if (message.includes('limit') || message.includes('Limit')) {
      return 'limit_reached';
    }
    return 'unknown_error';
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
