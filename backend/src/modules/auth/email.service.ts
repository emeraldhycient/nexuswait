import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;
  private from: string;

  constructor(private config: ConfigService) {
    this.resend = new Resend(config.get<string>('RESEND_API_KEY'));
    this.from =
      config.get<string>('EMAIL_FROM') || 'NexusWait <noreply@nexuswait.com>';
  }

  async sendVerificationEmail(
    to: string,
    verificationUrl: string,
  ): Promise<void> {
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#06060c;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:480px;margin:0 auto;padding:48px 24px">
    <div style="text-align:center;margin-bottom:32px">
      <span style="font-size:20px;font-weight:800;letter-spacing:2px;color:#00e8ff">NEXUSWAIT</span>
    </div>
    <div style="background:#0e0e1a;border:1px solid rgba(0,232,255,0.08);border-radius:12px;padding:32px 24px;text-align:center">
      <h1 style="color:#e0e0f0;font-size:22px;font-weight:700;margin:0 0 12px">Verify your email</h1>
      <p style="color:#7a7a9a;font-size:14px;line-height:1.6;margin:0 0 24px">
        Click the button below to verify your email address and activate your NexusWait account.
      </p>
      <a href="${verificationUrl}"
         style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#00e8ff,#0099b3);color:#fff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;letter-spacing:0.3px">
        Verify Email
      </a>
      <p style="color:#5a5a7a;font-size:12px;margin-top:24px;line-height:1.5">
        Or copy this link into your browser:<br>
        <span style="color:#00e8ff;word-break:break-all">${verificationUrl}</span>
      </p>
      <p style="color:#4a4a6a;font-size:11px;margin-top:20px">
        This link expires in 24 hours.
      </p>
    </div>
    <p style="color:#3a3a5a;font-size:11px;text-align:center;margin-top:24px;line-height:1.5">
      If you didn't create a NexusWait account, you can safely ignore this email.
    </p>
  </div>
</body>
</html>`.trim();

    const { error } = await this.resend.emails.send({
      from: this.from,
      to,
      subject: 'Verify your NexusWait email',
      html,
    });

    if (error) {
      throw new InternalServerErrorException(
        'Unable to send verification email. Please try again later.',
      );
    }
  }
}
