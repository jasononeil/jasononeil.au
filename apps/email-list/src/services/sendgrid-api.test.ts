import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { SendgridAPI } from './sendgrid-api';
import sgMail from '@sendgrid/mail';

// Mock @sendgrid/mail
vi.mock('@sendgrid/mail', () => ({
  default: {
    setApiKey: vi.fn(),
    send: vi.fn(),
  },
}));

describe('SendgridAPI', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.SENDGRID_API_KEY = 'test-api-key';
    process.env.DEFAULT_FROM_EMAIL = 'test@example.com';
    process.env.TEST_EMAIL = 'test-recipient@example.com';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should initialize with environment variables', () => {
    new SendgridAPI();
    expect(sgMail.setApiKey).toHaveBeenCalledWith('test-api-key');
  });

  it('should initialize with constructor options', () => {
    process.env.SENDGRID_API_KEY = 'custom-api-key';
    process.env.DEFAULT_FROM_EMAIL = 'custom@example.com';
    new SendgridAPI();
    expect(sgMail.setApiKey).toHaveBeenCalledWith('custom-api-key');
  });

  it('should send an email successfully', async () => {
    const api = new SendgridAPI();
    const mockedSend = sgMail.send as Mock;
    mockedSend.mockResolvedValueOnce([{ statusCode: 202 }, {}]);

    const result = await api.send({
      to: 'test-recipient@example.com',
      subject: 'Test Subject',
      text: 'Test plain text',
      html: '<p>Test HTML</p>',
    });

    expect(result).toBe(true);
    expect(mockedSend).toHaveBeenCalledWith({
      to: 'test-recipient@example.com',
      from: 'test@example.com',
      subject: 'Test Subject',
      text: 'Test plain text',
      html: '<p>Test HTML</p>',
    });
  });

  it('should throw an error when sending fails', async () => {
    const api = new SendgridAPI();
    const error = new Error('SendGrid API error');
    const mockedSend = sgMail.send as Mock;
    mockedSend.mockRejectedValueOnce(error);

    await expect(
      api.send({
        to: 'test-recipient@example.com',
        subject: 'Test Subject',
        text: 'Test plain text',
        html: '<p>Test HTML</p>',
      })
    ).rejects.toThrow('Failed to send email: SendGrid API error');
  });

  it('should skip sending in local development mode except to test email', async () => {
    process.env.LOCAL_DEVELOPMENT = 'true';
    const api = new SendgridAPI();

    const mockedSend = sgMail.send as Mock;

    // Should skip for non-test email
    const result1 = await api.send({
      to: 'regular@example.com',
      subject: 'Test Subject',
      text: 'Test plain text',
      html: '<p>Test HTML</p>',
    });

    expect(result1).toBe(false);
    expect(mockedSend).not.toHaveBeenCalled();

    // Should send to test email
    mockedSend.mockResolvedValueOnce([{ statusCode: 202 }, {}]);
    const result2 = await api.send({
      to: 'test-recipient@example.com',
      subject: 'Test Subject',
      text: 'Test plain text',
      html: '<p>Test HTML</p>',
    });

    expect(result2).toBe(true);
    expect(mockedSend).toHaveBeenCalled();
  });

  it('should throw an error when not initialized', async () => {
    process.env.SENDGRID_API_KEY = '';

    expect(() => new SendgridAPI()).toThrow('SendGrid API is not initialized');
  });
});
