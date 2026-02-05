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
});
