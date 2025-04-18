import { WordPressAPI, PostWithMetadata } from './wordpress-api';
import { HtmlRenderer } from './renderers/html-renderer';
import { MarkdownRenderer } from './renderers/markdown-renderer';
import { SendgridAPI } from './sendgrid-api';
import { RelatedPostsService } from './related-posts';

export class EmailListMailer {
  private wpApi: WordPressAPI;
  private htmlRenderer: HtmlRenderer;
  private markdownRenderer: MarkdownRenderer;
  private sendgridApi: SendgridAPI;
  private relatedPostsService: RelatedPostsService;

  constructor(
    wpApi: WordPressAPI,
    htmlRenderer: HtmlRenderer,
    markdownRenderer: MarkdownRenderer,
    sendgridApi: SendgridAPI,
    relatedPostsService: RelatedPostsService
  ) {
    this.wpApi = wpApi;
    this.htmlRenderer = htmlRenderer;
    this.markdownRenderer = markdownRenderer;
    this.sendgridApi = sendgridApi;
    this.relatedPostsService = relatedPostsService;
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
    return this.sendgridApi.send({
      to: testEmail,
      subject: `[TEST] ${post.title.rendered}`,
      text: plainTextContent,
      html: htmlContent,
    });
  }

  /**
   * Send a post to the test email address specified in the TEST_EMAIL environment variable
   */
  async sendPostToManualSubscribers(postId: number, list: string[]): Promise<boolean[]> {
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
    const results = [];
    for (const email of list) {
      const result = await this.sendgridApi.send({
        to: email,
        subject: `${post.title.rendered}`,
        text: plainTextContent,
        html: htmlContent,
      });
      results.push(result);
    }
    return results;
  }
}
