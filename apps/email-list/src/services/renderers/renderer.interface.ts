/**
 * Renderer Interface
 * 
 * Defines the contract for different content renderers.
 * Each renderer takes WordPress content and transforms it into a specific format.
 */

import { WPPost, WPCategory, WPTag, WPMedia, WPAuthor } from '../wordpress-api';

export interface PostMetadata {
  post: WPPost;
  categories: WPCategory[];
  tags: WPTag[];
  featuredMedia?: WPMedia;
  author: WPAuthor;
}

export interface RendererOptions {
  includeImages?: boolean;
  maxImageWidth?: number;
  includeMetadata?: boolean;
}

export interface Renderer {
  /**
   * Render a WordPress post into a specific format
   */
  renderPost(postData: PostMetadata, options?: RendererOptions): Promise<string>;
  
  /**
   * Get the content type of the rendered output
   */
  getContentType(): string;
}
