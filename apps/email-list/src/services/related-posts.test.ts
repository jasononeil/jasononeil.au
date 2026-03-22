import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { RelatedPostsService } from './related-posts';
import { WordPressAPI, WPPost } from './wordpress-api';

// Mock the WordPress API
mock.module('./wordpress-api', () => {
  return {
    WordPressAPI: mock().mockImplementation(() => ({
      getPost: mock(),
      getPosts: mock(),
    })),
  };
});

describe('RelatedPostsService', () => {
  let relatedPostsService: RelatedPostsService;
  let mockWpApi: WordPressAPI;

  beforeEach(() => {
    mockWpApi = new WordPressAPI('https://example.com/wp-json');
    relatedPostsService = new RelatedPostsService(mockWpApi);
  });

  it('should fetch previous posts correctly', async () => {
    // Mock current post
    const currentPost = {
      id: 100,
      date: '2023-05-15T12:00:00',
      title: { rendered: 'Current Post' },
    } as WPPost;

    // Mock a list of posts with various dates
    const mockPosts: WPPost[] = [
      { id: 99, date: '2023-05-10T12:00:00', title: { rendered: 'Previous Post 1' } } as WPPost,
      { id: 98, date: '2023-05-05T12:00:00', title: { rendered: 'Previous Post 2' } } as WPPost,
      { id: 97, date: '2023-05-01T12:00:00', title: { rendered: 'Previous Post 3' } } as WPPost,
      { id: 96, date: '2023-04-25T12:00:00', title: { rendered: 'Previous Post 4' } } as WPPost,
      { id: 95, date: '2023-04-20T12:00:00', title: { rendered: 'Previous Post 5' } } as WPPost,
      { id: 94, date: '2023-04-15T12:00:00', title: { rendered: 'Previous Post 6' } } as WPPost,
    ];

    // Set up mock implementations
    (mockWpApi.getPost as ReturnType<typeof mock>).mockResolvedValue(currentPost);
    (mockWpApi.getPosts as ReturnType<typeof mock>).mockResolvedValue(mockPosts);

    // Call the method
    const result = await relatedPostsService.getPreviousPosts(100, 5);

    // Verify the API was called correctly
    expect(mockWpApi.getPost).toHaveBeenCalledWith(100);
    expect(mockWpApi.getPosts).toHaveBeenCalledWith({ before: currentPost.date });

    // Verify the result contains the expected posts
    expect(result).toHaveLength(5);
  });

  it('should handle fewer available posts than requested', async () => {
    // Mock current post
    const currentPost = {
      id: 100,
      date: '2023-05-15T12:00:00',
      title: { rendered: 'Current Post' },
    } as WPPost;

    // Mock a list with only 2 previous posts
    const mockPosts: WPPost[] = [
      { id: 99, date: '2023-05-10T12:00:00', title: { rendered: 'Previous Post 1' } } as WPPost,
      { id: 98, date: '2023-05-05T12:00:00', title: { rendered: 'Previous Post 2' } } as WPPost,
    ];

    // Set up mock implementations
    (mockWpApi.getPost as ReturnType<typeof mock>).mockResolvedValue(currentPost);
    (mockWpApi.getPosts as ReturnType<typeof mock>).mockResolvedValue(mockPosts);

    // Call the method requesting 5 posts
    const result = await relatedPostsService.getPreviousPosts(100, 5);

    // Verify we only get the 2 available previous posts
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(99);
    expect(result[1].id).toBe(98);
  });

  it('should throw an error when API calls fail', async () => {
    // Mock API error
    (mockWpApi.getPost as ReturnType<typeof mock>).mockRejectedValue(new Error('API error'));

    // Verify the error is propagated
    await expect(relatedPostsService.getPreviousPosts(100)).rejects.toThrow(
      'Failed to fetch previous posts: API error'
    );
  });
});
