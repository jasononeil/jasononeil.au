import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WordPressAPI } from './wordpress-api';

// Mock fetch
global.fetch = vi.fn();

describe('WordPressAPI', () => {
  let api: WordPressAPI;

  beforeEach(() => {
    api = new WordPressAPI('https://example.com/wp-json');
    vi.resetAllMocks();
  });

  it('should fetch a post by ID', async () => {
    const mockPost = {
      id: 1,
      title: { rendered: 'Test Post' },
      content: { rendered: '<p>Test content</p>', protected: false },
      excerpt: { rendered: '<p>Test excerpt</p>', protected: false },
      date: '2023-01-01T12:00:00',
      modified: '2023-01-02T12:00:00',
      slug: 'test-post',
      status: 'publish',
      type: 'post',
      link: 'https://example.com/test-post',
      author: 1,
      featured_media: 2,
      categories: [3, 4],
      tags: [5, 6],
    };

    // Mock the fetch response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPost,
    });

    const post = await api.getPost(1);

    expect(global.fetch).toHaveBeenCalledWith('https://example.com/wp-json/wp/v2/posts/1');
    expect(post).toEqual(mockPost);
  });

  it('should handle errors when fetching a post', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(api.getPost(999)).rejects.toThrow(
      'API error (404): Not Found - Error fetching post 999 - Error fetching post 999'
    );
  });

  it('should fetch posts with filters', async () => {
    const mockPosts = [
      { id: 1, title: { rendered: 'Post 1' } },
      { id: 2, title: { rendered: 'Post 2' } },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPosts,
    });

    const posts = await api.getPosts({
      page: 2,
      perPage: 5,
      categories: [10, 20],
      tags: [30, 40],
      search: 'test',
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/wp-json/wp/v2/posts?page=2&per_page=5&categories=10%2C20&tags=30%2C40&search=test'
    );
    expect(posts).toEqual(mockPosts);
  });

  it('should fetch a category by ID', async () => {
    const mockCategory = {
      id: 3,
      name: 'Test Category',
      slug: 'test-category',
      description: 'A test category',
      count: 5,
      link: 'https://example.com/category/test-category',
      parent: 0,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCategory,
    });

    const category = await api.getCategory(3);

    expect(global.fetch).toHaveBeenCalledWith('https://example.com/wp-json/wp/v2/categories/3');
    expect(category).toEqual(mockCategory);
  });

  it('should fetch post with all metadata', async () => {
    const mockPost = {
      id: 1,
      title: { rendered: 'Test Post' },
      content: { rendered: '<p>Test content</p>', protected: false },
      excerpt: { rendered: '<p>Test excerpt</p>', protected: false },
      date: '2023-01-01T12:00:00',
      modified: '2023-01-02T12:00:00',
      slug: 'test-post',
      status: 'publish',
      type: 'post',
      link: 'https://example.com/test-post',
      author: 1,
      featured_media: 2,
      categories: [3, 4],
      tags: [5, 6],
    };

    const mockCategories = [
      {
        id: 3,
        name: 'Category 1',
        slug: 'category-1',
        description: '',
        count: 5,
        link: '',
        parent: 0,
      },
      {
        id: 4,
        name: 'Category 2',
        slug: 'category-2',
        description: '',
        count: 3,
        link: '',
        parent: 0,
      },
    ];

    const mockTags = [
      { id: 5, name: 'Tag 1', slug: 'tag-1', description: '', count: 2, link: '', parent: 0 },
      { id: 6, name: 'Tag 2', slug: 'tag-2', description: '', count: 4, link: '', parent: 0 },
    ];

    const mockMedia = {
      id: 2,
      date: '2023-01-01T10:00:00',
      slug: 'test-image',
      type: 'attachment',
      link: 'https://example.com/test-image',
      title: { rendered: 'Test Image' },
      author: 1,
      caption: { rendered: '' },
      alt_text: 'Test image alt text',
      media_type: 'image',
      mime_type: 'image/jpeg',
      media_details: {
        width: 800,
        height: 600,
        file: 'test-image.jpg',
        sizes: {
          thumbnail: {
            file: 'test-image-150x150.jpg',
            width: 150,
            height: 150,
            mime_type: 'image/jpeg',
            source_url: 'https://example.com/wp-content/uploads/test-image-150x150.jpg',
          },
        },
      },
      source_url: 'https://example.com/wp-content/uploads/test-image.jpg',
    };

    const mockAuthor = {
      id: 1,
      name: 'Test Author',
      url: 'https://example.com',
      description: 'Author description',
      link: 'https://example.com/author/test-author',
      slug: 'test-author',
      avatar_urls: {
        '24': 'https://example.com/avatar-24.jpg',
        '48': 'https://example.com/avatar-48.jpg',
        '96': 'https://example.com/avatar-96.jpg',
      },
    };

    // Mock fetch to return different responses based on the URL
    (global.fetch as any).mockImplementation((url: string) => {
      // Match the URL to determine which mock to return
      if (url.endsWith('/posts/1')) {
        return {
          ok: true,
          json: async () => mockPost,
        };
      } else if (url.endsWith('/categories/3')) {
        return {
          ok: true,
          json: async () => mockCategories[0],
        };
      } else if (url.endsWith('/categories/4')) {
        return {
          ok: true,
          json: async () => mockCategories[1],
        };
      } else if (url.endsWith('/tags/5')) {
        return {
          ok: true,
          json: async () => mockTags[0],
        };
      } else if (url.endsWith('/tags/6')) {
        return {
          ok: true,
          json: async () => mockTags[1],
        };
      } else if (url.endsWith('/users/1')) {
        return {
          ok: true,
          json: async () => mockAuthor,
        };
      } else if (url.endsWith('/media/2')) {
        return {
          ok: true,
          json: async () => mockMedia,
        };
      }

      // If URL doesn't match any expected pattern, throw an error
      throw new Error(`Unexpected URL in test: ${url}`);
    });

    const result = await api.getPostWithMetadata(1);

    expect(result).toEqual({
      post: mockPost,
      categories: mockCategories,
      tags: mockTags,
      featuredMedia: mockMedia,
      author: mockAuthor,
    });
  });
});
