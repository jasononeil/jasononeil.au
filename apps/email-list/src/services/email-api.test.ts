import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import { Resend } from 'resend';

// Create a mock send function
const mockSend = mock();

// Mock resend
mock.module('resend', () => ({
  Resend: mock().mockImplementation(() => ({
    emails: {
      send: mockSend,
    },
  })),
}));

// Re-import after mock setup
const { EmailAPI } = await import('./email-api');

describe('EmailAPI', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    mockSend.mockReset();
    process.env.RESEND_API_KEY = 'test-api-key';
    process.env.DEFAULT_FROM_EMAIL = 'test@example.com';
    process.env.DEFAULT_FROM_NAME = 'Test Sender';
    process.env.TEST_EMAIL = 'test-recipient@example.com';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should initialize with environment variables', () => {
    new EmailAPI();
    expect(Resend).toHaveBeenCalledWith('test-api-key');
  });

  it('should initialize with constructor options', () => {
    process.env.RESEND_API_KEY = 'custom-api-key';
    process.env.DEFAULT_FROM_EMAIL = 'custom@example.com';
    new EmailAPI();
    expect(Resend).toHaveBeenCalledWith('custom-api-key');
  });

  it('should send an email successfully', async () => {
    const api = new EmailAPI();
    mockSend.mockResolvedValueOnce({ data: { id: 'test-id' }, error: null });

    const result = await api.send({
      to: 'test-recipient@example.com',
      subject: 'Test Subject',
      text: 'Test plain text',
      html: '<p>Test HTML</p>',
    });

    expect(result).toBe(true);
    expect(mockSend).toHaveBeenCalledWith({
      from: 'Test Sender <test@example.com>',
      to: ['test-recipient@example.com'],
      subject: 'Test Subject',
      text: 'Test plain text',
      html: '<p>Test HTML</p>',
    });
  });

  it('should throw an error when sending fails', async () => {
    const api = new EmailAPI();
    mockSend.mockResolvedValueOnce({
      data: null,
      error: { message: 'Resend API error' },
    });

    await expect(
      api.send({
        to: 'test-recipient@example.com',
        subject: 'Test Subject',
        text: 'Test plain text',
        html: '<p>Test HTML</p>',
      })
    ).rejects.toThrow('Failed to send email: Resend API error');
  });

  it('should skip sending in local development mode except to test email', async () => {
    process.env.LOCAL_DEVELOPMENT = 'true';
    const api = new EmailAPI();

    // Should skip for non-test email
    const result1 = await api.send({
      to: 'regular@example.com',
      subject: 'Test Subject',
      text: 'Test plain text',
      html: '<p>Test HTML</p>',
    });

    expect(result1).toBe(false);
    expect(mockSend).not.toHaveBeenCalled();

    // Should send to test email
    mockSend.mockResolvedValueOnce({ data: { id: 'test-id' }, error: null });
    const result2 = await api.send({
      to: 'test-recipient@example.com',
      subject: 'Test Subject',
      text: 'Test plain text',
      html: '<p>Test HTML</p>',
    });

    expect(result2).toBe(true);
    expect(mockSend).toHaveBeenCalled();
  });

  it('should throw an error when not initialized', async () => {
    process.env.RESEND_API_KEY = '';

    expect(() => new EmailAPI()).toThrow('Resend API is not initialized');
  });
});
