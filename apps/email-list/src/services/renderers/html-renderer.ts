import { Renderer, PostMetadata, RendererOptions } from './renderer.interface';
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
} from '../../types/wp-blocks';

export class HtmlRenderer implements Renderer {
  /**
   * Render a WordPress post as HTML
   */
  async renderPost(postData: PostMetadata, options: RendererOptions = {}): Promise<string> {
    const { post, categories, tags, featuredMedia, author } = postData;
    const { includeImages = true, maxImageWidth = 600, includeMetadata = true } = options;

    let html = '';

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
      html += `  <p><em>By ${this.escapeHtml(author.name)}</em></p>\n`;

      if (categories.length > 0) {
        const categoryLinks = categories
          .map((cat) => `<a href="${cat.link}">${this.escapeHtml(cat.name)}</a>`)
          .join(', ');
        html += `  <p><em>Categories: ${categoryLinks}</em></p>\n`;
      }

      if (tags.length > 0) {
        const tagNames = tags
          .map((tag) => `<a href="${tag.link}">${this.escapeHtml(tag.name)}</a>`)
          .join(', ');
        html += `  <p><em>Tags: ${tagNames}</em></p>\n`;
      }

      html += `</div>\n\n`;
    }

    // Add featured image if available and images are included
    if (includeImages && featuredMedia) {
      const imgWidth = Math.min(maxImageWidth, featuredMedia.media_details.width);
      html += `<div class="featured-image">\n`;
      html += `  <img src="${featuredMedia.source_url}" alt="${this.escapeHtml(
        featuredMedia.alt_text || featuredMedia.title.rendered
      )}" width="${imgWidth}" />\n`;
      html += `</div>\n\n`;
    }

    // Render content
    if (post.blocks && post.blocks.length > 0) {
      // If we have Gutenberg blocks, use them
      html += this.renderBlocks(post.blocks);
    } else {
      // Otherwise, use the rendered HTML content
      html += post.content.rendered;
    }

    // Add a link back to the original post
    html += `\n<div class="post-link">\n`;
    html += `  <p><a href="${post.link}">View original post</a></p>\n`;
    html += `</div>\n`;

    return html;
  }

  getContentType(): string {
    return 'text/html';
  }

  private renderBlocks(blocks: WpBlocks): string {
    let html = '';

    for (const block of blocks) {
      html += this.renderBlock(block) + '\n\n';
    }

    return html;
  }

  private renderBlock(block: WpBlock): string {
    // Handle different block types using type guards
    if (isParagraphBlock(block)) {
      return `<p>${block.attributes.content}</p>`;
    }

    if (isHeadingBlock(block)) {
      const level = block.attributes.level;
      return `<h${level}>${block.attributes.content}</h${level}>`;
    }

    if (isPreformattedBlock(block)) {
      return `<pre>${this.escapeHtml(block.attributes.content)}</pre>`;
    }

    if (isImageBlock(block)) {
      const alt = block.attributes.alt || '';
      const caption = block.attributes.caption
        ? `<figcaption>${block.attributes.caption}</figcaption>`
        : '';
      return `<figure class="image">
  <img src="${block.attributes.url}" alt="${this.escapeHtml(alt)}" />
  ${caption}
</figure>`;
    }

    if (isListBlock(block)) {
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

    if (isQuoteBlock(block)) {
      let content = '';

      // Handle quote content from innerBlocks
      if (block.innerBlocks && block.innerBlocks.length > 0) {
        for (const innerBlock of block.innerBlocks) {
          content += this.renderBlock(innerBlock);
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

    if (isPullquoteBlock(block)) {
      let content = '';

      // Handle pullquote content from innerBlocks
      if (block.innerBlocks && block.innerBlocks.length > 0) {
        for (const innerBlock of block.innerBlocks) {
          content += this.renderBlock(innerBlock);
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

    if (isSeparatorBlock(block)) {
      return `<hr />`;
    }

    if (isTableBlock(block)) {
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

    if (isGalleryBlock(block)) {
      if (block.innerBlocks) {
        const images = block.innerBlocks
          .map((image) => {
            return this.renderBlock(image);
          })
          .join('\n\n');
        return `<div class="gallery">\n\n${images}\n\n</div>`;
      }
      if (block.attributes.images) {
        throw new Error(
          `Not implemented: until now we haven't seen a case where 'images' is defined`
        );
      }
    }

    if (isVideoBlock(block)) {
      if (block.attributes.src) {
        return `<figure class="video">
  <video controls src="${block.attributes.src}"></video>
  ${block.attributes.caption ? `<figcaption>${block.attributes.caption}</figcaption>` : ''}
</figure>`;
      }
      return `<p>[Video content]</p>`;
    }

    if (isEmbedBlock(block)) {
      // For email, we can't include iframes, so we'll just add a link
      if (block.attributes.url) {
        return `<p><a href="${block.attributes.url}">View embedded content</a></p>`;
      }
      return `<p>[Embedded content]</p>`;
    }

    // For unknown blocks, return a placeholder or the raw content if available
    if (block.attributes.content) {
      return `<div class="unknown-block">${block.attributes.content}</div>`;
    }

    throw new Error(`Unknown block type: ${block.name}. Data: ${JSON.stringify(block, null, 2)}`);
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
