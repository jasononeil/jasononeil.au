import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmailListMailer } from './email-list-mailer';
import { WordPressAPI } from './wordpress-api';
import { HtmlRenderer } from './renderers/html-renderer';
import { MarkdownRenderer } from './renderers/markdown-renderer';
import { EmailAPI } from './email-api';
import { RelatedPostsService } from './related-posts';

// Mock all dependencies
vi.mock('../wordpress-api');
vi.mock('../renderers/html-renderer');
vi.mock('../renderers/markdown-renderer');
vi.mock('../email-api');
vi.mock('../related-posts');

describe('EmailListMailer', () => {
  let wpApi: WordPressAPI;
  let htmlRenderer: HtmlRenderer;
  let markdownRenderer: MarkdownRenderer;
  let emailApi: EmailAPI;
  let relatedPostsService: RelatedPostsService;
  let mailer: EmailListMailer;

  const mockPost = {
    id: 123,
    title: { rendered: 'Test Post Title' },
    content: { rendered: 'Test content' },
    date: '2023-01-01T12:00:00',
    modified: '2023-01-02T12:00:00',
    slug: 'test-post',
    status: 'publish',
    type: 'post',
    link: 'https://example.com/test-post',
    excerpt: { rendered: 'Test excerpt' },
    featured_media: 456,
    categories: [1, 2],
    tags: [3, 4],
    author: 789,
  };

  const mockPostWithMetadata = {
    post: mockPost,
    categories: [
      { id: 1, name: 'Category 1' },
      { id: 2, name: 'Category 2' },
    ],
    tags: [
      { id: 3, name: 'Tag 1' },
      { id: 4, name: 'Tag 2' },
    ],
    featuredMedia: { id: 456, source_url: 'https://example.com/image.jpg' },
    author: { id: 789, name: 'Test Author' },
  };

  const mockPreviousPosts = [
    { ...mockPost, id: 122, title: { rendered: 'Previous Post 1' } },
    { ...mockPost, id: 121, title: { rendered: 'Previous Post 2' } },
  ];

  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();

    // Set up environment variables
    process.env.TEST_EMAIL = 'test@example.com';

    // Create mock instances
    wpApi = {
      getPost: vi.fn().mockResolvedValue(mockPost),
      getPostWithMetadata: vi.fn().mockResolvedValue(mockPostWithMetadata),
    } as unknown as WordPressAPI;

    htmlRenderer = {
      renderEmail: vi.fn().mockResolvedValue('<html>Test HTML email</html>'),
    } as unknown as HtmlRenderer;

    markdownRenderer = {
      renderEmail: vi.fn().mockResolvedValue('# Test Markdown email'),
    } as unknown as MarkdownRenderer;

    emailApi = {
      send: vi.fn().mockResolvedValue(true),
    } as unknown as EmailAPI;

    relatedPostsService = {
      getPreviousPosts: vi.fn().mockResolvedValue(mockPreviousPosts),
    } as unknown as RelatedPostsService;

    // Create the mailer instance
    mailer = new EmailListMailer(
      wpApi,
      htmlRenderer,
      markdownRenderer,
      emailApi,
      relatedPostsService
    );
  });

  it('should send a test email successfully', async () => {
    const result = await mailer.sendPostToTestEmail(123);

    // Verify all the expected methods were called
    expect(wpApi.getPost).toHaveBeenCalledWith(123);
    expect(wpApi.getPostWithMetadata).toHaveBeenCalledWith(123);
    expect(relatedPostsService.getPreviousPosts).toHaveBeenCalledWith(123);
    expect(htmlRenderer.renderEmail).toHaveBeenCalledWith(mockPostWithMetadata, mockPreviousPosts);
    expect(markdownRenderer.renderEmail).toHaveBeenCalledWith(
      mockPostWithMetadata,
      mockPreviousPosts
    );

    // Verify the email was sent with the correct parameters
    expect(emailApi.send).toHaveBeenCalledWith({
      to: 'test@example.com',
      subject: '[TEST] Test Post Title',
      text: '# Test Markdown email',
      html: '<html>Test HTML email</html>',
    });

    // Verify the result
    expect(result).toBe(true);
  });

  it('should throw an error if TEST_EMAIL is not set', async () => {
    delete process.env.TEST_EMAIL;

    await expect(mailer.sendPostToTestEmail(123)).rejects.toThrow(
      'TEST_EMAIL environment variable is not set'
    );
  });

  it('should propagate errors from dependencies', async () => {
    // Test error from WordPress API
    wpApi.getPost = vi.fn().mockRejectedValue(new Error('WordPress API error'));
    await expect(mailer.sendPostToTestEmail(123)).rejects.toThrow('WordPress API error');

    // Test error from Email API
    wpApi.getPost = vi.fn().mockResolvedValue(mockPost);
    emailApi.send = vi.fn().mockRejectedValue(new Error('Email API error'));
    await expect(mailer.sendPostToTestEmail(123)).rejects.toThrow('Email API error');
  });

  describe('sendPostToManualSubscribers', () => {
    it('should send emails to all recipients successfully', async () => {
      const recipients = ['user1@example.com', 'user2@example.com', 'user3@example.com'];
      const results = await mailer.sendPostToManualSubscribers(123, recipients);

      // Verify all emails were sent
      expect(emailApi.send).toHaveBeenCalledTimes(3);
      expect(results).toHaveLength(3);

      // Verify all results are successful
      results.forEach((result, index) => {
        expect(result.email).toBe(recipients[index]);
        expect(result.success).toBe(true);
        expect(result.error).toBeUndefined();
      });

      // Verify emails were sent with correct subject (no [TEST] prefix)
      expect(emailApi.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user1@example.com',
          subject: 'Test Post Title',
        })
      );
    });

    it('should handle individual email failures without stopping', async () => {
      const recipients = ['user1@example.com', 'user2@example.com', 'user3@example.com'];

      // Mock second email to fail
      emailApi.send = vi
        .fn()
        .mockResolvedValueOnce(true)
        .mockRejectedValueOnce(new Error('Rate limit exceeded'))
        .mockResolvedValueOnce(true);

      const results = await mailer.sendPostToManualSubscribers(123, recipients);

      // Verify all emails were attempted
      expect(emailApi.send).toHaveBeenCalledTimes(3);
      expect(results).toHaveLength(3);

      // Verify first email succeeded
      expect(results[0]).toEqual({
        email: 'user1@example.com',
        success: true,
      });

      // Verify second email failed with error
      expect(results[1]).toEqual({
        email: 'user2@example.com',
        success: false,
        error: 'Rate limit exceeded',
      });

      // Verify third email succeeded
      expect(results[2]).toEqual({
        email: 'user3@example.com',
        success: true,
      });
    });

    it('should call progress callback for each email', async () => {
      const recipients = ['user1@example.com', 'user2@example.com'];
      const progressCallback = vi.fn();

      await mailer.sendPostToManualSubscribers(123, recipients, progressCallback);

      // Verify callback was called for each email
      expect(progressCallback).toHaveBeenCalledTimes(2);
      expect(progressCallback).toHaveBeenNthCalledWith(1, 'user1@example.com', true, undefined);
      expect(progressCallback).toHaveBeenNthCalledWith(2, 'user2@example.com', true, undefined);
    });

    it('should call progress callback with errors', async () => {
      const recipients = ['user1@example.com', 'user2@example.com'];
      const progressCallback = vi.fn();

      emailApi.send = vi
        .fn()
        .mockResolvedValueOnce(true)
        .mockRejectedValueOnce(new Error('Send failed'));

      await mailer.sendPostToManualSubscribers(123, recipients, progressCallback);

      expect(progressCallback).toHaveBeenCalledTimes(2);
      expect(progressCallback).toHaveBeenNthCalledWith(1, 'user1@example.com', true, undefined);
      expect(progressCallback).toHaveBeenNthCalledWith(
        2,
        'user2@example.com',
        false,
        'Send failed'
      );
    });

    it('should handle email API returning false', async () => {
      const recipients = ['user1@example.com'];

      emailApi.send = vi.fn().mockResolvedValue(false);

      const results = await mailer.sendPostToManualSubscribers(123, recipients);

      expect(results[0]).toEqual({
        email: 'user1@example.com',
        success: false,
        error: 'Email API returned false',
      });
    });

    it('should respect rate limit delay between sends', async () => {
      const recipients = ['user1@example.com', 'user2@example.com'];
      process.env.RESEND_RATE_LIMIT_PER_SEC = '2';

      const startTime = Date.now();
      await mailer.sendPostToManualSubscribers(123, recipients);
      const endTime = Date.now();

      // Should take at least 600ms (500ms + 100ms buffer) for rate limit
      expect(endTime - startTime).toBeGreaterThanOrEqual(550);
    });

    it('should use default rate limit if env variable not set', async () => {
      delete process.env.RESEND_RATE_LIMIT_PER_SEC;

      const recipients = ['user1@example.com', 'user2@example.com'];
      const startTime = Date.now();
      await mailer.sendPostToManualSubscribers(123, recipients);
      const endTime = Date.now();

      // Default is 2 req/sec, so should take at least 600ms
      expect(endTime - startTime).toBeGreaterThanOrEqual(550);
    });
  });
});
