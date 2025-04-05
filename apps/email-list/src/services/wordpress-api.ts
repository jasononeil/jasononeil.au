/**
 * WordPress API Service
 *
 * Handles communication with the WordPress REST API to fetch posts,
 * categories, tags, media, and author information.
 *
 * Supports both core WordPress API endpoints (/wp-json/wp/v2/...)
 * and plugin-specific endpoints (/wp-json/[plugin]/[version]/...)
 */

import { WpBlocks, parseBlocks } from '../types/wp-blocks';

// Types for WordPress API responses
export type WPPostStatus =
  | 'publish'
  | 'future'
  | 'draft'
  | 'pending'
  | 'private'
  | 'trash'
  | 'auto-draft'
  | 'inherit';

export type WPPostType =
  | 'post'
  | 'page'
  | 'attachment'
  | 'revision'
  | 'nav_menu_item'
  | 'custom_css'
  | 'customize_changeset'
  | 'oembed_cache'
  | 'user_request'
  | 'wp_block'
  | 'wp_template'
  | 'wp_template_part'
  | 'wp_navigation'
  | string; // Allow for custom post types

export interface WPPost {
  id: number;
  date: string;
  modified: string;
  slug: string;
  status: WPPostStatus;
  type: WPPostType;
  link: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
    protected: boolean;
  };
  excerpt: {
    rendered: string;
    protected: boolean;
  };
  author: number;
  featured_media: number;
  categories: number[];
  tags: number[];
  // Blocks will be available if using the Gutenberg editor
  blocks?: WpBlocks;
}

export interface WPCategory {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  parent: number;
}

export interface WPTag {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
}

export interface WPMedia {
  id: number;
  date: string;
  slug: string;
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  author: number;
  caption: {
    rendered: string;
  };
  alt_text: string;
  media_type: string;
  mime_type: string;
  media_details: {
    width: number;
    height: number;
    file: string;
    sizes: {
      [key: string]: {
        file: string;
        width: number;
        height: number;
        mime_type: string;
        source_url: string;
      };
    };
  };
  source_url: string;
}

export interface WPAuthor {
  id: number;
  name: string;
  url: string;
  description: string;
  link: string;
  slug: string;
  avatar_urls: {
    [key: string]: string;
  };
}

export class WordPressAPI {
  private baseUrl: string;
  private coreApiUrl: string;
  private username?: string;
  private password?: string;

  constructor(
    baseUrl: string,
    options?: {
      username?: string;
      password?: string;
    }
  ) {
    // Remove trailing slash if present
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

    // Set up core API URL with version (default to 'wp/v2')
    const coreApiVersion = 'wp/v2';
    this.coreApiUrl = `${this.baseUrl}/${coreApiVersion}`;

    // Set credentials from options or environment variables
    this.username = options?.username || process.env.WP_API_USERNAME;
    this.password = options?.password || process.env.WP_API_PASSWORD;
  }

  /**
   * Get a plugin-specific API endpoint URL
   * Format: /wp-json/[plugin]/[version]/[endpoint]
   */
  getPluginApiUrl(plugin: string, version: string, endpoint: string = ''): string {
    const pluginBase = `${this.baseUrl}/${plugin}/${version}`;
    return endpoint ? `${pluginBase}/${endpoint}` : pluginBase;
  }

  /**
   * Private helper method to make API calls with consistent error handling
   * @param url The API endpoint URL
   * @param errorContext Additional context for error messages
   * @returns The parsed JSON response
   */
  private async apiCall<T>(url: string, errorContext: string = ''): Promise<T> {
    try {
      // Create headers with Basic Authentication if credentials are available
      const headers: HeadersInit = {};
      let response;
      if (this.username && this.password) {
        const authString = Buffer.from(`${this.username}:${this.password}`).toString('base64');
        headers['Authorization'] = `Basic ${authString}`;
        response = await fetch(url, { headers });
      } else {
        response = await fetch(url);
      }

      if (!response.ok) {
        // Try to get more details from the response
        let errorDetails = '';
        try {
          const errorData = await response.json();
          errorDetails = JSON.stringify(errorData);
        } catch {
          // If we can't parse the error as JSON, use the status text
          errorDetails = response.statusText;
        }

        throw new Error(
          `API error (${url} ${response.status}): ${errorDetails}${
            errorContext ? ` - ${errorContext}` : ''
          }`
        );
      }

      return await response.json();
    } catch (error) {
      // Re-throw fetch errors with more context
      if (error instanceof Error) {
        throw new Error(`${error.message}${errorContext ? ` - ${errorContext}` : ''}`);
      }
      throw error;
    }
  }

  /**
   * Fetch a single post by ID
   */
  async getPost(id: number): Promise<WPPost> {
    const url = `${this.coreApiUrl}/posts/${id}`;
    return this.apiCall<WPPost>(url, `Error fetching post ${id}`);
  }

  /**
   * Fetch multiple posts with optional filters
   */
  async getPosts(
    options: {
      page?: number;
      perPage?: number;
      categories?: number[];
      tags?: number[];
      search?: string;
    } = {}
  ): Promise<WPPost[]> {
    const { page = 1, perPage = 10, categories, tags, search } = options;

    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    if (categories && categories.length > 0) {
      params.append('categories', categories.join(','));
    }

    if (tags && tags.length > 0) {
      params.append('tags', tags.join(','));
    }

    if (search) {
      params.append('search', search);
    }

    const url = `${this.coreApiUrl}/posts?${params.toString()}`;
    return this.apiCall<WPPost[]>(url, `Error fetching posts (page=${page}, perPage=${perPage})`);
  }

  /**
   * Fetch a category by ID
   */
  async getCategory(id: number): Promise<WPCategory> {
    const url = `${this.coreApiUrl}/categories/${id}`;
    return this.apiCall<WPCategory>(url, `Error fetching category ${id}`);
  }

  /**
   * Fetch multiple categories
   */
  async getCategories(
    options: {
      page?: number;
      perPage?: number;
    } = {}
  ): Promise<WPCategory[]> {
    const { page = 1, perPage = 100 } = options;

    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    const url = `${this.coreApiUrl}/categories?${params.toString()}`;
    return this.apiCall<WPCategory[]>(
      url,
      `Error fetching categories (page=${page}, perPage=${perPage})`
    );
  }

  /**
   * Fetch a tag by ID
   */
  async getTag(id: number): Promise<WPTag> {
    const url = `${this.coreApiUrl}/tags/${id}`;
    return this.apiCall<WPTag>(url, `Error fetching tag ${id}`);
  }

  /**
   * Fetch multiple tags
   */
  async getTags(
    options: {
      page?: number;
      perPage?: number;
    } = {}
  ): Promise<WPTag[]> {
    const { page = 1, perPage = 100 } = options;

    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    const url = `${this.coreApiUrl}/tags?${params.toString()}`;
    return this.apiCall<WPTag[]>(url, `Error fetching tags (page=${page}, perPage=${perPage})`);
  }

  /**
   * Fetch media by ID
   */
  async getMedia(id: number): Promise<WPMedia> {
    const url = `${this.coreApiUrl}/media/${id}`;
    return this.apiCall<WPMedia>(url, `Error fetching media ${id}`);
  }

  /**
   * Fetch author by ID
   */
  async getAuthor(id: number): Promise<WPAuthor> {
    const url = `${this.coreApiUrl}/users/${id}`;
    return this.apiCall<WPAuthor>(url, `Error fetching author ${id}`);
  }

  /**
   * Fetch post blocks using the VIP Block Data API
   */
  async getPostBlocks(postId: number): Promise<WpBlocks> {
    const url = this.getPluginApiUrl('vip-block-data-api', 'v1', `posts/${postId}/blocks`);
    const rawBlocks = await this.apiCall<unknown[]>(
      url,
      `Error fetching blocks for post ${postId}`
    );
    
    try {
      return parseBlocks(rawBlocks);
    } catch (error) {
      if (error instanceof Error) {
        // Add more context to the error
        throw new Error(`Failed to parse blocks for post ${postId}: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Fetch all metadata for a post (categories, tags, featured image, author)
   */
  async getPostWithMetadata(postId: number): Promise<{
    post: WPPost;
    categories: WPCategory[];
    tags: WPTag[];
    featuredMedia?: WPMedia;
    author: WPAuthor;
  }> {
    try {
      const post = await this.getPost(postId);

      // Fetch categories, tags, featured media, and author in parallel
      const [categories, tags, author] = await Promise.all([
        Promise.all(post.categories.map((id) => this.getCategory(id))),
        Promise.all(post.tags.map((id) => this.getTag(id))),
        this.getAuthor(post.author),
      ]);

      // Fetch featured media if available
      let featuredMedia: WPMedia | undefined;
      if (post.featured_media > 0) {
        featuredMedia = await this.getMedia(post.featured_media);
      }

      return {
        post,
        categories,
        tags,
        featuredMedia,
        author,
      };
    } catch (error) {
      console.error(`Error fetching post ${postId} with metadata:`, error);
      throw error;
    }
  }
}
