import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

import { buildEmailTemplate } from './email-template';

const DEFAULT_WEB_URL = 'http://localhost:3000';
const DEFAULT_EMAIL_FROM = 'ERP Smart <onboarding@resend.dev>';

interface DispatchParams {
  to: string;
  subject: string;
  html: string;
  text: string;
}

// Reads RESEND_API_KEY/EMAIL_FROM/WEB_URL directly from process.env, same
// convention already used by JwtStrategy and main.ts's CORS/JWT_SECRET
// checks — this project has no ConfigService/nestjs-config module.
@Injectable()
export class MailerService {
  private readonly logger = new Logger('Mailer');
  private readonly resend: Resend | null;
  private readonly emailFrom: string;
  private readonly webUrl: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.emailFrom = process.env.EMAIL_FROM ?? DEFAULT_EMAIL_FROM;
    this.webUrl = process.env.WEB_URL ?? DEFAULT_WEB_URL;

    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY is not set — emails will be logged instead of sent.');
    }
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const link = `${this.webUrl}/verify-email?token=${encodeURIComponent(token)}`;
    const { html, text } = buildEmailTemplate({
      heading: 'Verify your email',
      body: 'Confirm your email address to finish setting up your ERP Smart account.',
      buttonLabel: 'Verify email',
      link,
    });
    await this.dispatch({ to, subject: 'Verify your ERP Smart account', html, text });
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const link = `${this.webUrl}/reset-password?token=${encodeURIComponent(token)}`;
    const { html, text } = buildEmailTemplate({
      heading: 'Reset your password',
      body: "We received a request to reset your ERP Smart password. If this wasn't you, you can safely ignore this email.",
      buttonLabel: 'Reset password',
      link,
    });
    await this.dispatch({ to, subject: 'Reset your ERP Smart password', html, text });
  }

  async sendInviteEmail(to: string, token: string): Promise<void> {
    const link = `${this.webUrl}/accept-invite?token=${encodeURIComponent(token)}`;
    const { html, text } = buildEmailTemplate({
      heading: "You're invited",
      body: "You've been invited to join a company on ERP Smart. Set a password to accept the invitation.",
      buttonLabel: 'Accept invitation',
      link,
    });
    await this.dispatch({ to, subject: "You've been invited to join a company on ERP Smart", html, text });
  }

  // Never throws — every caller (register, forgotPassword, inviteMember)
  // awaits this with no try/catch of its own, so a Resend outage or bad API
  // key must never fail the auth/company request that triggered the email.
  private async dispatch(params: DispatchParams): Promise<void> {
    if (!this.resend) {
      this.logger.log(`[stub email] to=${params.to} subject="${params.subject}"`);
      return;
    }

    try {
      const { error } = await this.resend.emails.send({
        from: this.emailFrom,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      });

      if (error) {
        // Resend returns a typed error object for API-level failures (bad
        // key, rate limit, etc.) rather than throwing — never log the API
        // key itself, only the provider's own error name/message.
        this.logger.error(`Failed to send email to ${params.to}: ${error.name} — ${error.message}`);
      }
    } catch (err) {
      // Network-level failure (DNS, timeout, ...) — caught so a transient
      // provider outage never propagates into the caller's request.
      this.logger.error(
        `Unexpected error sending email to ${params.to}: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
  }
}
