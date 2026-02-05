import { WordPressAPI, PostWithMetadata } from './wordpress-api';
import { HtmlRenderer } from './renderers/html-renderer';
import { MarkdownRenderer } from './renderers/markdown-renderer';
import { EmailAPI } from './email-api';
import { RelatedPostsService } from './related-posts';

export class EmailListMailer {
  private wpApi: WordPressAPI;
  private htmlRenderer: HtmlRenderer;
  private markdownRenderer: MarkdownRenderer;
  private emailApi: EmailAPI;
  private relatedPostsService: RelatedPostsService;

  constructor(
    wpApi: WordPressAPI,
    htmlRenderer: HtmlRenderer,
    markdownRenderer: MarkdownRenderer,
    emailApi: EmailAPI,
    relatedPostsService: RelatedPostsService
  ) {
    this.wpApi = wpApi;
    this.htmlRenderer = htmlRenderer;
    this.markdownRenderer = markdownRenderer;
    this.emailApi = emailApi;
    this.relatedPostsService = relatedPostsService;
  }

  /**
   * Delay helper to respect API rate limits
   */
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Calculate delay between requests based on rate limit
   * Adds 100ms buffer for safety
   */
  private getDelayBetweenRequests(): number {
    const rateLimitPerSec = parseInt(process.env.RESEND_RATE_LIMIT_PER_SEC || '2');
    const delayMs = 1000 / rateLimitPerSec + 100;
    return delayMs;
  }

  /**
   * Send a post to the test email address specified in the TEST_EMAIL environment variable
   */
  async sendPostToTestEmail(postId: number): Promise<boolean> {
    const testEmail = process.env.TEST_EMAIL;

    if (!testEmail) {
      throw new Error('TEST_EMAIL environment variable is not set');
    }

    // Fetch the post and its metadata
    const post = await this.wpApi.getPost(postId);
    const postWithMetadata = await this.wpApi.getPostWithMetadata(postId);

    // Fetch related posts
    const previousPosts = await this.relatedPostsService.getPreviousPosts(postId);

    // Render the post content in both HTML and plain text formats
    const htmlContent = await this.htmlRenderer.renderEmail(postWithMetadata, previousPosts);
    const plainTextContent = await this.markdownRenderer.renderEmail(
      postWithMetadata,
      previousPosts
    );

    // Send the email
    return this.emailApi.send({
      to: testEmail,
      subject: `[TEST] ${post.title.rendered}`,
      text: plainTextContent,
      html: htmlContent,
    });
  }

  /**
   * Send a post to a list of email addresses with detailed result tracking
   */
  async sendPostToManualSubscribers(
    postId: number,
    list: string[],
    onProgress?: (email: string, success: boolean, error?: string) => void
  ): Promise<{ email: string; success: boolean; error?: string }[]> {
    const testEmail = process.env.TEST_EMAIL;

    if (!testEmail) {
      throw new Error('TEST_EMAIL environment variable is not set');
    }

    // Fetch the post and its metadata
    const post = await this.wpApi.getPost(postId);
    const postWithMetadata = await this.wpApi.getPostWithMetadata(postId);

    // Fetch related posts
    const previousPosts = await this.relatedPostsService.getPreviousPosts(postId);

    // Render the post content in both HTML and plain text formats
    const htmlContent = await this.htmlRenderer.renderEmail(postWithMetadata, previousPosts);
    const plainTextContent = await this.markdownRenderer.renderEmail(
      postWithMetadata,
      previousPosts
    );

    // Send the email
    const results: { email: string; success: boolean; error?: string }[] = [];
    const delayMs = this.getDelayBetweenRequests();

    for (let i = 0; i < list.length; i++) {
      const email = list[i];
      let success = false;
      let error: string | undefined;

      try {
        success = await this.emailApi.send({
          to: email,
          subject: `${post.title.rendered}`,
          text: plainTextContent,
          html: htmlContent,
        });

        if (!success) {
          error = 'Email API returned false';
        }
      } catch (err) {
        success = false;
        error = err instanceof Error ? err.message : String(err);
      }

      results.push({ email, success, error });

      // Call progress callback if provided
      if (onProgress) {
        onProgress(email, success, error);
      }

      // Add delay between sends to respect rate limit
      if (i < list.length - 1) {
        await this.delay(delayMs);
      }
    }
    return results;
  }
}
