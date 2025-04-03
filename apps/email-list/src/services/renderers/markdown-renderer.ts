/**
 * Markdown Renderer
 *
 * Converts WordPress post content to Markdown format.
 * Handles various block types and includes metadata.
 */

import { Renderer, PostMetadata, RendererOptions } from './renderer.interface';

export class MarkdownRenderer implements Renderer {
  /**
   * Render a WordPress post as Markdown
   */
  async renderPost(postData: PostMetadata, options: RendererOptions = {}): Promise<string> {
    const { post, categories, tags, featuredMedia, author } = postData;
    const { includeImages = true, includeMetadata = true } = options;

    let markdown = '';

    // Add title
    markdown += `# ${post.title.rendered}\n\n`;

    // Add metadata if requested
    if (includeMetadata) {
      const date = new Date(post.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      markdown += `*Published on ${date}*\n\n`;
      markdown += `*By ${author.name}*\n\n`;

      if (categories.length > 0) {
        markdown += `*Categories: ${categories.map((c) => c.name).join(', ')}*\n\n`;
      }

      if (tags.length > 0) {
        markdown += `*Tags: ${tags.map((t) => t.name).join(', ')}*\n\n`;
      }
    }

    // Add featured image if available and requested
    if (includeImages && featuredMedia) {
      markdown += `![${featuredMedia.alt_text || featuredMedia.title.rendered}](${featuredMedia.source_url})\n\n`;
    }

    // Process content
    if (post.blocks) {
      // If Gutenberg blocks are available, process them
      markdown += this.renderBlocks(post.blocks);
    } else {
      // Otherwise, convert HTML to Markdown
      markdown += this.convertHtmlToMarkdown(post.content.rendered);
    }

    return markdown;
  }

  /**
   * Get the content type
   */
  getContentType(): string {
    return 'text/markdown';
  }

  /**
   * Render Gutenberg blocks to Markdown
   */
  private renderBlocks(blocks: unknown[]): string {
    let markdown = '';

    for (const block of blocks) {
      markdown += this.renderBlock(block) + '\n\n';
    }

    return markdown;
  }

  /**
   * Render a single Gutenberg block to Markdown
   */
  private renderBlock(block: unknown): string {
    const { blockName, attrs, innerBlocks, innerHTML } = block as any;

    // Handle different block types
    switch (blockName) {
      case 'core/paragraph':
        return this.convertHtmlToMarkdown(innerHTML);

      case 'core/heading':
        const level = attrs?.level || 2;
        const headingText = this.stripHtml(innerHTML);
        return '#'.repeat(level) + ' ' + headingText;

      case 'core/list':
        return this.convertHtmlToMarkdown(innerHTML);

      case 'core/image':
        if (attrs?.url) {
          const alt = attrs.alt || '';
          return `![${alt}](${attrs.url})`;
        }
        return '';

      case 'core/quote':
        const quoteText = this.stripHtml(innerHTML);
        return `> ${quoteText.split('\n').join('\n> ')}`;

      case 'core/code':
        const code = this.stripHtml(innerHTML);
        return '```\n' + code + '\n```';

      case 'core/html':
        // For custom HTML, we'll just convert it to markdown
        return this.convertHtmlToMarkdown(innerHTML);

      default:
        // For unknown blocks, try to extract text content
        if (innerBlocks && innerBlocks.length > 0) {
          return innerBlocks.map((block) => this.renderBlock(block)).join('\n\n');
        }
        return this.convertHtmlToMarkdown(innerHTML);
    }
  }

  /**
   * Convert HTML to Markdown
   * This is a simple implementation - in a real app, you might use a library like turndown
   */
  private convertHtmlToMarkdown(html: string): string {
    // This is a very basic implementation
    // In a real application, you would use a library like turndown

    let markdown = html;

    // Remove HTML tags but preserve line breaks
    markdown = markdown.replace(/<br\s*\/?>/gi, '\n');
    markdown = markdown.replace(/<p>(.*?)<\/p>/gi, '$1\n\n');
    markdown = markdown.replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n');
    markdown = markdown.replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n');
    markdown = markdown.replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n');
    markdown = markdown.replace(/<h4>(.*?)<\/h4>/gi, '#### $1\n\n');
    markdown = markdown.replace(/<h5>(.*?)<\/h5>/gi, '##### $1\n\n');
    markdown = markdown.replace(/<h6>(.*?)<\/h6>/gi, '###### $1\n\n');
    markdown = markdown.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
    markdown = markdown.replace(/<b>(.*?)<\/b>/gi, '**$1**');
    markdown = markdown.replace(/<em>(.*?)<\/em>/gi, '*$1*');
    markdown = markdown.replace(/<i>(.*?)<\/i>/gi, '*$1*');
    markdown = markdown.replace(/<a href="(.*?)">(.*?)<\/a>/gi, '[$2]($1)');
    markdown = markdown.replace(/<ul>(.*?)<\/ul>/gis, (match, p1) => {
      return p1.replace(/<li>(.*?)<\/li>/gi, '- $1\n');
    });
    markdown = markdown.replace(/<ol>(.*?)<\/ol>/gis, (match, p1) => {
      let index = 1;
      return p1.replace(/<li>(.*?)<\/li>/gi, () => {
        return `${index++}. $1\n`;
      });
    });

    // Remove any remaining HTML tags and decode entities
    markdown = this.stripHtml(markdown)

    return markdown.trim();
  }

  /**
   * Strip HTML tags from a string
   */
  private stripHtml(html: string): string {
    return this.decodeHtmlEntities(html.replace(/<[^>]*>/g, ''));
  }

  /**
   * Decode all HTML entities in a string
   */
  private decodeHtmlEntities(text: string): string {
    // First pass: handle common HTML entities
    let decoded = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–')
      .replace(/&lsquo;/g, '‘')
      .replace(/&rsquo;/g, '’')
      .replace(/&ldquo;/g, '“')
      .replace(/&rdquo;/g, '”')
      .replace(/&hellip;/g, '…')
      .replace(/&bull;/g, '•')
    ;

    // Second pass: handle numeric entities
    decoded = decoded.replace(/&#(\d+);/g, (match, dec) => {
      return String.fromCharCode(parseInt(dec, 10));
    });

    // Third pass: handle hexadecimal entities
    decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });

    // Preserve Unicode characters that might be in the original text
    return decoded;
  }
}
