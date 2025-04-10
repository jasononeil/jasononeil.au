import sgMail from '@sendgrid/mail';

export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
  from?: string;
}

export class SendgridAPI {
  private defaultFromEmail: string;
  private isLocalDevelopment: boolean;
  private testEmail: string | undefined;

  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;
    const defaultFromEmail = process.env.DEFAULT_FROM_EMAIL || 'from@example.com';
    const isLocalDevelopment = !!process.env.LOCAL_DEVELOPMENT;
    const testEmail = process.env.TEST_EMAIL || 'to@example.com';

    if (apiKey) {
      sgMail.setApiKey(apiKey);
    } else {
      throw new Error('SendGrid API is not initialized. Please provide a valid API key.');
    }

    this.defaultFromEmail = defaultFromEmail;
    this.isLocalDevelopment = isLocalDevelopment;
    this.testEmail = testEmail;
  }

  /**
   * Send an email using SendGrid
   *
   * In local development mode, emails will only be sent to the test email address
   * specified in the TEST_EMAIL environment variable.
   */
  async send(options: SendEmailOptions): Promise<boolean> {
    const { to, subject, text, html, from = this.defaultFromEmail } = options;

    // In local development, only send to the test email
    if (this.isLocalDevelopment && to !== this.testEmail) {
      return false;
    }

    try {
      await sgMail.send({
        to,
        from,
        subject,
        text,
        html,
      });
      return true;
    } catch (error) {
      throw new Error(
        `Failed to send email: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
