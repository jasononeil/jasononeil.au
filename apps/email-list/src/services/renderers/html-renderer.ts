import { Renderer, PostMetadata, RendererOptions } from './renderer.interface';
import { WPPost } from '../wordpress-api';
import fs from 'fs';
import path from 'path';
import {
  WpBlock,
  WpBlocks,
  isParagraphBlock,
  isHeadingBlock,
  isImageBlock,
  isListBlock,
  isQuoteBlock,
  isPullquoteBlock,
  isPreformattedBlock,
  isSeparatorBlock,
  isTableBlock,
  isGalleryBlock,
  isVideoBlock,
  isEmbedBlock,
  ParagraphBlock,
  HeadingBlock,
  PreformattedBlock,
  ImageBlock,
  ListBlock,
  QuoteBlock,
  PullquoteBlock,
  TableBlock,
  GalleryBlock,
  VideoBlock,
  EmbedBlock,
} from '../../types/wp-blocks';

export class HtmlRenderer implements Renderer {
  /**
   * Render a WordPress post as HTML
   */
  async renderPost(postData: PostMetadata, options: RendererOptions = {}): Promise<string> {
    const { post, categories, tags, featuredMedia, author } = postData;
    const { includeImages = true, maxImageWidth = 600, includeMetadata = true } = options;

    let html = '';

    // Read CSS from public directory
    const css = fs.readFileSync(path.join(process.cwd(), 'public', 'email-styles.css'), 'utf-8');

    // Add CSS styles
    html += `<style>\n${css}\n</style>\n\n`;

    // Add header
    html += `<header class="blog-header">
  <h2><a href="https://jasononeil.au">A post from Jason O'Neil's blog</a></h2>
</header>\n\n`;

    // Wrap everything in an article with post class
    html += `<article class="post">\n`;

    // Add title. Note the API returns HTML that is already escaped.
    html += `<h1>${post.title.rendered}</h1>\n\n`;

    // Add metadata if requested
    if (includeMetadata) {
      const date = new Date(post.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      html += `<div class="post-meta">\n`;
      html += `  <p><em>Published on ${date}</em></p>\n`;
      html += `  <p><em>By ${escapeHtml(author.name)}</em></p>\n`;

      if (categories.length > 0) {
        const categoryLinks = categories
          .map((cat) => `<a href="${cat.link}">${escapeHtml(cat.name)}</a>`)
          .join(', ');
        html += `  <p><em>Categories: ${categoryLinks}</em></p>\n`;
      }

      if (tags.length > 0) {
        const tagNames = tags
          .map((tag) => `<a href="${tag.link}">${escapeHtml(tag.name)}</a>`)
          .join(', ');
        html += `  <p><em>Tags: ${tagNames}</em></p>\n`;
      }

      html += `</div>\n\n`;
    }

    // Add featured image if available and images are included
    if (includeImages && featuredMedia) {
      const imgWidth = Math.min(maxImageWidth, featuredMedia.media_details.width);
      html += `<div class="featured-image">\n`;
      html += `  <img src="${featuredMedia.source_url}" alt="${escapeHtml(
        featuredMedia.alt_text || featuredMedia.title.rendered
      )}" width="${imgWidth}" />\n`;
      html += `</div>\n\n`;
    }

    // Render content
    if (post.blocks && post.blocks.length > 0) {
      // If we have Gutenberg blocks, use them
      html += renderBlocks(post.blocks);
    } else {
      // Otherwise, use the rendered HTML content
      html += post.content.rendered;
    }

    // Add a link back to the original post
    html += `\n<div class="post-link">\n`;
    html += `  <p><a href="${post.link}">View original post</a></p>\n`;
    html += `</div>\n`;

    // Add unsubscribe link
    html += `\n<div class="unsubscribe">\n`;
    html += `  <p><small><a href="{{unsubscribe_url}}">Unsubscribe</a> from these emails</small></p>\n`;
    html += `</div>\n`;

    // Close the article tag
    html += `</article>\n`;

    return html;
  }

  /**
   * Render a "More from the blog" section with previous posts
   */
  renderMoreFromTheBlog(posts: WPPost[], options: RendererOptions = {}): string {
    if (!posts || posts.length === 0) {
      return '';
    }

    let html = '<div class="more-from-blog">\n';
    html += '  <h2>More from the blog</h2>\n';

    for (const post of posts) {
      // Get the post title (already HTML escaped by WordPress)
      const title = post.title.rendered;

      // Format the post date
      const date = new Date(post.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Start the post container
      html += '  <div class="related-post">\n';
      html += `    <h3><a href="${post.link}">${title}</a></h3>\n`;
      html += `    <p class="post-date"><em>Published on ${date}</em></p>\n`;

      // Get the post content or excerpt
      // If content is longer than approximately 100 words, use the Wordpress excerpt.
      // This is a rough estimate using a dodgy regex to strip HTML.
      const textContent = post.content.rendered.replace(/<[^>]*>/g, ' ');
      const wordCount = textContent.split(/\s+/).length;

      if (wordCount > 200) {
        // For HTML we'll just use the excerpt if available, otherwise the full content
        // A proper implementation would use an HTML parser to safely truncate
        html += `    <div class="post-excerpt">${post.excerpt.rendered}</div>\n`;
        html += `    <p><a href="${post.link}">Read more...</a></p>\n`;
      } else {
        html += `    <div class="post-content">${post.content.rendered}</div>\n`;
      }

      html += '  </div>\n\n';
    }

    html += '</div>\n';
    return html;
  }

  getContentType(): string {
    return 'text/html';
  }
}

export function renderBlocks(blocks: WpBlocks): string {
  let html = '';

  for (const block of blocks) {
    html += renderBlock(block) + '\n\n';
  }

  return html;
}

export function renderBlock(block: WpBlock): string {
  // Handle different block types using type guards
  if (isParagraphBlock(block)) {
    return renderParagraphBlock(block);
  }

  if (isHeadingBlock(block)) {
    return renderHeadingBlock(block);
  }

  if (isPreformattedBlock(block)) {
    return renderPreformattedBlock(block);
  }

  if (isImageBlock(block)) {
    return renderImageBlock(block);
  }

  if (isListBlock(block)) {
    return renderListBlock(block);
  }

  if (isQuoteBlock(block)) {
    return renderQuoteBlock(block);
  }

  if (isPullquoteBlock(block)) {
    return renderPullquoteBlock(block);
  }

  if (isSeparatorBlock(block)) {
    return renderSeparatorBlock();
  }

  if (isTableBlock(block)) {
    return renderTableBlock(block);
  }

  if (isGalleryBlock(block)) {
    return renderGalleryBlock(block);
  }

  if (isVideoBlock(block)) {
    return renderVideoBlock(block);
  }

  if (isEmbedBlock(block)) {
    return renderEmbedBlock(block);
  }

  throw new Error(`Unknown block type: ${block.name}. Data: ${JSON.stringify(block, null, 2)}`);
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderParagraphBlock(block: ParagraphBlock): string {
  return `<p>${block.attributes.content}</p>`;
}

export function renderHeadingBlock(block: HeadingBlock): string {
  const level = block.attributes.level;
  return `<h${level}>${block.attributes.content}</h${level}>`;
}

export function renderPreformattedBlock(block: PreformattedBlock): string {
  return `<pre>${escapeHtml(block.attributes.content)}</pre>`;
}

export function renderImageBlock(block: ImageBlock): string {
  const alt = block.attributes.alt || '';
  const caption = block.attributes.caption
    ? `<figcaption>${block.attributes.caption}</figcaption>`
    : '';
  return `<figure class="image">
<img src="${block.attributes.url}" alt="${escapeHtml(alt)}" />
${caption}
</figure>`;
}

export function renderListBlock(block: ListBlock): string {
  const tag = block.attributes.ordered ? 'ol' : 'ul';
  let items = '';

  // Handle list items from innerBlocks
  if (block.innerBlocks && block.innerBlocks.length > 0) {
    for (const innerBlock of block.innerBlocks) {
      if (innerBlock.name === 'core/list-item') {
        items += `  <li>${innerBlock.attributes.content}</li>\n`;
      }
    }
  }
  // Fallback to items array if available
  else if (block.attributes.values) {
    items += `  ${block.attributes.values}\n`;
  }

  return `<${tag}>\n${items}</${tag}>`;
}

export function renderQuoteBlock(block: QuoteBlock): string {
  let content = '';

  // Handle quote content from innerBlocks
  if (block.innerBlocks && block.innerBlocks.length > 0) {
    for (const innerBlock of block.innerBlocks) {
      content += renderBlock(innerBlock);
    }
  }
  // Fallback to direct content if available
  else if (block.attributes.value) {
    content = block.attributes.value;
  }

  const citation = block.attributes.citation ? `<cite>${block.attributes.citation}</cite>` : '';

  return `<blockquote>
${content}
${citation}
</blockquote>`;
}

export function renderPullquoteBlock(block: PullquoteBlock): string {
  let content = '';

  // Handle pullquote content from innerBlocks
  if (block.innerBlocks && block.innerBlocks.length > 0) {
    for (const innerBlock of block.innerBlocks) {
      content += renderBlock(innerBlock);
    }
  }
  // Fallback to direct content if available
  else if (block.attributes.value) {
    content = block.attributes.value;
  }

  return `<figure class="pullquote">
<blockquote>
  ${content}
</blockquote>
</figure>`;
}

export function renderSeparatorBlock(): string {
  return `<hr />`;
}

export function renderTableBlock(block: TableBlock): string {
  let tableHtml = '<table>\n';

  // Add caption if available
  if (block.attributes.caption) {
    tableHtml += `  <caption>${block.attributes.caption}</caption>\n`;
  }

  // Add header if available
  if (block.attributes.head && block.attributes.head.length > 0) {
    tableHtml += '  <thead>\n    <tr>\n';
    for (const cell of block.attributes.head[0].cells) {
      const tag = cell.tag || 'th';
      tableHtml += `      <${tag}>${cell.content}</${tag}>\n`;
    }
    tableHtml += '    </tr>\n  </thead>\n';
  }

  // Add body
  if (block.attributes.body && block.attributes.body.length > 0) {
    tableHtml += '  <tbody>\n';
    for (const row of block.attributes.body) {
      tableHtml += '    <tr>\n';
      for (const cell of row.cells) {
        const tag = cell.tag || 'td';
        tableHtml += `      <${tag}>${cell.content}</${tag}>\n`;
      }
      tableHtml += '    </tr>\n';
    }
    tableHtml += '  </tbody>\n';
  }

  // Add footer if available
  if (block.attributes.foot && block.attributes.foot.length > 0) {
    tableHtml += '  <tfoot>\n    <tr>\n';
    for (const cell of block.attributes.foot[0].cells) {
      const tag = cell.tag || 'td';
      tableHtml += `      <${tag}>${cell.content}</${tag}>\n`;
    }
    tableHtml += '    </tr>\n  </tfoot>\n';
  }

  tableHtml += '</table>';
  return tableHtml;
}

export function renderGalleryBlock(block: GalleryBlock): string {
  if (block.innerBlocks) {
    const images = block.innerBlocks
      .map((image) => {
        return renderBlock(image);
      })
      .join('\n\n');
    return `<div class="gallery">\n\n${images}\n\n</div>`;
  }
  throw new Error(
    `Not implemented: until now we haven't seen a case where 'innerBlocks' is not defined, and probably 'images' is`
  );
}

export function renderVideoBlock(block: VideoBlock): string {
  if (block.attributes.src) {
    return `<figure class="video">
<video controls src="${block.attributes.src}"></video>
${block.attributes.caption ? `<figcaption>${block.attributes.caption}</figcaption>` : ''}
</figure>`;
  }
  return `<p>[Video content]</p>`;
}

export function renderEmbedBlock(block: EmbedBlock): string {
  // For email, we can't include iframes, so we'll just add a link
  if (block.attributes.url) {
    return `<p><a href="${block.attributes.url}">View embedded content</a></p>`;
  }
  return `<p>[Embedded content]</p>`;
}
