/**
 * Related Posts Service
 *
 * Provides functionality to fetch posts related to a given post,
 * such as previous posts for "More from the blog" sections.
 */

import { WordPressAPI, WPPost } from './wordpress-api';

export class RelatedPostsService {
  private wpApi: WordPressAPI;

  constructor(wpApi: WordPressAPI) {
    this.wpApi = wpApi;
  }

  /**
   * Fetches the 5 posts published before the specified post
   *
   * @param postId The ID of the current post
   * @param count The number of previous posts to fetch (default: 5)
   * @returns An array of previous posts
   */
  async getPreviousPosts(postId: number, count: number = 5): Promise<WPPost[]> {
    try {
      // First, get the current post to determine its date
      const currentPost = await this.wpApi.getPost(postId);

      const earlierPosts = await this.wpApi.getPosts({
        before: currentPost.date,
      });

      return earlierPosts.slice(0, count);
    } catch (error) {
      throw new Error(
        `Failed to fetch previous posts: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
