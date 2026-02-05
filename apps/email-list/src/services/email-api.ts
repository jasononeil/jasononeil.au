import { Resend } from 'resend';

export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
  from?: { name: string; email: string };
}

export class EmailAPI {
  private resend: Resend;
  private defaultFrom: { name: string; email: string };
  private isLocalDevelopment: boolean;
  private testEmail: string | undefined;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    const defaultFromEmail = process.env.DEFAULT_FROM_EMAIL || 'from@example.com';
    const defaultFromName = process.env.DEFAULT_FROM_NAME || 'Example email';
    const isLocalDevelopment = !!process.env.LOCAL_DEVELOPMENT;
    const testEmail = process.env.TEST_EMAIL || 'to@example.com';

    if (!apiKey) {
      throw new Error('Resend API is not initialized. Please provide a valid API key.');
    }

    this.resend = new Resend(apiKey);
    this.defaultFrom = { name: defaultFromName, email: defaultFromEmail };
    this.isLocalDevelopment = isLocalDevelopment;
    this.testEmail = testEmail;
  }

  /**
   * Send an email using Resend
   *
   * In local development mode, emails will only be sent to the test email address
   * specified in the TEST_EMAIL environment variable.
   */
  async send(options: SendEmailOptions): Promise<boolean> {
    const { to, subject, text, html, from = this.defaultFrom } = options;

    // In local development, only send to the test email
    if (this.isLocalDevelopment && to !== this.testEmail) {
      return false;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: `${from.name} <${from.email}>`,
        to: [to],
        subject,
        text,
        html,
      });

      if (error) {
        throw new Error(error.message);
      }

      return true;
    } catch (error) {
      throw new Error(
        `Failed to send email: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
