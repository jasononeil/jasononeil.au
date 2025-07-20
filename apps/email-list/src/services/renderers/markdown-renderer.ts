/**
 * Markdown Renderer
 *
 * Converts WordPress post content to Markdown format.
 * Handles various block types and includes metadata.
 */

import { Renderer, RendererOptions } from './renderer.interface';
import {
  WpBlock,
  WpBlocks,
  isParagraphBlock,
  isHeadingBlock,
  isImageBlock,
  isListBlock,
  isQuoteBlock,
  isPullquoteBlock,
  isEmbedBlock,
  isVideoBlock,
  isTableBlock,
  isGalleryBlock,
  isSeparatorBlock,
  isFootnotesBlock,
  isReusableBlock,
  isPreformattedBlock,
} from '../../types/wp-blocks';
import { WPPost, PostWithMetadata } from '../wordpress-api';

export class MarkdownRenderer implements Renderer {
  /**
   * Render a WordPress post as Markdown
   */
  async renderPost(postData: PostWithMetadata, options: RendererOptions = {}): Promise<string> {
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
    }

    // Add featured image if available and requested
    if (includeImages && featuredMedia) {
      markdown += `![${featuredMedia.alt_text || featuredMedia.title.rendered}](${featuredMedia.source_url})\n\n`;
    }

    if (post.blocks && post.blocks.length > 0) {
      // If Gutenberg blocks are available, process them
      markdown += this.renderBlocks(post.blocks, postData);
    } else {
      // Otherwise, convert HTML to Markdown
      markdown += convertHtmlToMarkdown(post.content.rendered);
    }

    // Add a link back to the original post
    markdown += `\n\nView original post: ${post.link}\n`;

    if (includeMetadata) {
      if (tags.length > 0) {
        markdown += `*Tags: ${tags.map((t) => t.name).join(', ')}*\n\n`;
      }
    }

    return markdown;
  }

  /**
   * Render a complete email with post content and more from the blog
   */
  async renderEmail(
    postData: PostWithMetadata,
    morePosts: WPPost[],
    options: RendererOptions = {}
  ): Promise<string> {
    let markdown = '';

    // Add header
    markdown += `A post from [Jason O'Neil's blog](https://jasononeil.au)\n\n`;

    // Render the main post
    markdown += await this.renderPost(postData, options);

    // Add more from the blog if there are posts
    if (morePosts && morePosts.length > 0) {
      markdown += '\n\n';
      markdown += this.renderMoreFromTheBlog(morePosts, options);
    }

    // Add unsubscribe link
    markdown += `\n\n[Unsubscribe]({{unsubscribe_url}}) from these emails\n`;

    return markdown;
  }

  /**
   * Render a "More from the blog" section with previous posts
   */
  renderMoreFromTheBlog(posts: WPPost[], options: RendererOptions = {}): string {
    if (!posts || posts.length === 0) {
      return '';
    }

    let markdown = '## More from the blog\n\n';

    for (const post of posts) {
      // Get the post title
      const title = post.title.rendered;

      // Get the post content or excerpt
      let content = '';
      // Use full content as fallback
      const fullContent = convertHtmlToMarkdown(post.content.rendered);

      // If content is longer than 200 words, use the excerpt
      const words = fullContent.split(/\s+/);
      if (words.length > 200) {
        content = convertHtmlToMarkdown(post.excerpt.rendered);
        content += `\n\nRead more: ${post.link}\n\n`;
      } else {
        content = fullContent;
      }

      // Format the post date
      const date = new Date(post.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Add the post to the markdown
      markdown += `### [${title}](${post.link})\n\n`;
      markdown += `*Published on ${date}*\n\n`;
      markdown += `${content}\n\n`;
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
  private renderBlocks(blocks: WpBlocks, postData: PostWithMetadata): string {
    let markdown = '';

    for (const block of blocks) {
      markdown += this.renderBlock(block, postData) + '\n\n';
    }

    return markdown;
  }

  /**
   * Render a single Gutenberg block to Markdown
   */
  private renderBlock(block: WpBlock, postData: PostWithMetadata): string {
    // Handle different block types using type guards
    if (isParagraphBlock(block)) {
      return convertHtmlToMarkdown(block.attributes.content);
    }

    if (isHeadingBlock(block)) {
      return '#'.repeat(block.attributes.level) + ' ' + block.attributes.content;
    }

    if (isPreformattedBlock(block)) {
      return '```\n' + block.attributes.content + '\n```';
    }

    if (isListBlock(block)) {
      if (block.innerBlocks) {
        return block.innerBlocks
          .map((item) => {
            if (block.attributes.ordered) {
              return `1. ${item.attributes.content}`;
            } else {
              return `- ${item.attributes.content}`;
            }
          })
          .join('\n');
      } else if (block.attributes.values && typeof block.attributes.values === 'string') {
        // This is a HTML of the <li> elements
        const listHtml = block.attributes.ordered
          ? `<ol>${block.attributes.values}</ol>`
          : `<ul>${block.attributes.values}</ul>`;
        return convertHtmlToMarkdown(listHtml);
      } else {
        throw new Error('Expected either `innerBlocks` or `block.attributes.values` to be defined');
      }
    }

    if (isImageBlock(block)) {
      const alt = block.attributes.alt || '';
      return `![${alt}](${block.attributes.url})`;
    }

    if (isQuoteBlock(block)) {
      let content = '';
      if (block.innerBlocks) {
        content = block.innerBlocks.map((block) => this.renderBlock(block, postData)).join('\n\n');
      } else if (block.attributes.value) {
        content = convertHtmlToMarkdown(block.attributes.value) || '';
      }
      const quoteMarkdown = '> ' + content.split('\n').join('\n> ');
      const citationMarkdown = block.attributes.citation
        ? `\n>\n> — ${convertHtmlToMarkdown(block.attributes.citation)}`
        : '';
      return quoteMarkdown + citationMarkdown;
    }

    if (isPullquoteBlock(block)) {
      return `> ${block.attributes.value}`;
    }

    if (isEmbedBlock(block)) {
      return `[${block.attributes.providerNameSlug || 'Embedded content'}: ${block.attributes.url}](${block.attributes.url})`;
    }

    if (isVideoBlock(block)) {
      const caption = block.attributes.caption ? `\n*${block.attributes.caption}*` : '';
      return `[Video: ${block.attributes.src}](${block.attributes.src})${caption}`;
    }

    if (isTableBlock(block)) {
      let markdown = '';

      // Add header row if present
      if (block.attributes.head && block.attributes.head.length > 0) {
        const headerRow = block.attributes.head[0];
        markdown += '| ' + headerRow.cells.map((cell) => cell.content).join(' | ') + ' |\n';
        markdown += '| ' + headerRow.cells.map(() => '---').join(' | ') + ' |\n';
      } else if (block.attributes.body.length > 0) {
        // If no header, create a separator row based on first body row
        const firstRow = block.attributes.body[0];
        markdown += '| ' + firstRow.cells.map(() => '---').join(' | ') + ' |\n';
      }

      // Add body rows
      for (const row of block.attributes.body) {
        markdown += '| ' + row.cells.map((cell) => cell.content).join(' | ') + ' |\n';
      }

      // Add caption if present
      if (block.attributes.caption) {
        markdown += `\n*${block.attributes.caption}*`;
      }

      return markdown;
    }

    if (isGalleryBlock(block)) {
      if (block.innerBlocks) {
        return block.innerBlocks
          .map((image) => {
            if (isImageBlock(image)) {
              const caption = image.attributes.caption ? `\n*${image.attributes.caption}*` : '';
              return `![${image.attributes.alt || ''}](${image.attributes.url})${caption}`;
            }
            return '';
          })
          .join('\n\n');
      }
      if (block.attributes.images) {
        return block.attributes.images
          .map((image) => {
            const caption = image.caption ? `\n*${image.caption}*` : '';
            return `![${image.alt || ''}](${image.url})${caption}`;
          })
          .join('\n\n');
      }
      throw new Error(
        `Gallery has neither innerBlocks or attributes.images defined: ${JSON.stringify(block, null, 2)}`
      );
    }

    if (isSeparatorBlock(block)) {
      return '---';
    }

    if (isFootnotesBlock(block)) {
      if (postData.footnotes && postData.footnotes.length > 0) {
        let footnotesMd = '## Footnotes\n\n';

        // Use numeric index instead of ID for plain text email format
        postData.footnotes.forEach((footnote, index) => {
          const numericIndex = index + 1;
          footnotesMd += `${numericIndex}: ${convertHtmlToMarkdown(footnote.content)}\n\n`;
        });

        return footnotesMd;
      }
      return ''; // Don't show anything if no footnotes
    }

    if (isReusableBlock(block) && block.innerBlocks) {
      return block.innerBlocks
        .map((innerBlock) => this.renderBlock(innerBlock, postData))
        .join('\n\n');
    }

    // This should never happen if parseBlock throws for unknown types,
    // but we'll keep this as a safety measure
    throw new Error(`Unknown block type: ${block.name}`);
  }
}

/**
 * Convert HTML to Markdown
 * This is a simple implementation - in a real app, you might use a library like turndown
 */
export function convertHtmlToMarkdown(html: string): string {
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

  // Process footnotes before normal links
  // From `<sup data-fn="abc" class="fn"><a href="#abc" id="abc-link">1</a></sup>` to `[^1]`
  markdown = markdown.replace(
    /<sup data-fn="[^"]*" class="fn"><a href="#[^"]*" id="[^"]*-link">(\d+)<\/a><\/sup>/gi,
    '[^$1]'
  );

  markdown = markdown.replace(/<a href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

  // Handle lists with proper spacing
  markdown = markdown.replace(/<ul>(.*?)<\/ul>/gis, (match, p1) => {
    const listItems = p1.replace(/<li>(.*?)<\/li>/gi, '- $1\n');
    return listItems + '\n';
  });

  markdown = markdown.replace(/<ol>(.*?)<\/ol>/gis, (match, p1: string) => {
    let index = 1;
    const listItems = p1.replace(/<li>(.*?)<\/li>/gi, (content: string) => {
      return `${index++}. ${content}\n`;
    });
    return listItems + '\n';
  });

  // Remove any remaining HTML tags and decode entities
  markdown = stripHtml(markdown);

  return markdown.trim();
}

/**
 * Strip HTML tags from a string
 */
function stripHtml(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, ''));
}

/**
 * Decode all HTML entities in a string
 */
function decodeHtmlEntities(text: string): string {
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
    .replace(/&bull;/g, '•');
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
