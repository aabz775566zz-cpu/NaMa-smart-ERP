import { Injectable, Logger } from '@nestjs/common';

// Phase 2 keeps email delivery minimal: log the message instead of sending it.
// Swapping in a real Resend call (RESEND_API_KEY is already in .env.example)
// is a one-function change here, not a schema or call-site change.
@Injectable()
export class MailerService {
  private readonly logger = new Logger('Mailer');

  async send(to: string, subject: string, body: string): Promise<void> {
    this.logger.log(`[stub email] to=${to} subject="${subject}" | ${body}`);
  }
}
