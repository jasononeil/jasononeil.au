import { describe, it, expect } from 'vitest';
import { HtmlRenderer } from './html-renderer';
import { PostMetadata } from './renderer.interface';

describe('HtmlRenderer', () => {
  const renderer = new HtmlRenderer();

  it('should render a post title and content', async () => {
    const postData: PostMetadata = {
      post: {
        id: 1,
        title: { rendered: 'Test Post' },
        content: {
          rendered: '<p>This is a test paragraph.</p><p>Another paragraph.</p>',
          protected: false,
        },
        excerpt: { rendered: '<p>Test excerpt</p>', protected: false },
        date: '2023-01-01T12:00:00',
        modified: '2023-01-02T12:00:00',
        slug: 'test-post',
        status: 'publish',
        type: 'post',
        link: 'https://example.com/test-post',
        author: 1,
        featured_media: 0,
        categories: [],
        tags: [],
      },
      categories: [],
      tags: [],
      author: {
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
      },
    };

    const html = await renderer.renderPost(postData);

    expect(html).toContain('<h1>Test Post</h1>');
    expect(html).toContain('<em>By Test Author</em>');
    expect(html).toContain('<p>This is a test paragraph.</p>');
    expect(html).toContain('<p>Another paragraph.</p>');
    expect(html).toContain('<a href="https://example.com/test-post">View original post</a>');
  });

  it('should include featured image when available', async () => {
    const postData: PostMetadata = {
      post: {
        id: 1,
        title: { rendered: 'Test Post' },
        content: { rendered: '<p>Content with image.</p>', protected: false },
        excerpt: { rendered: '<p>Test excerpt</p>', protected: false },
        date: '2023-01-01T12:00:00',
        modified: '2023-01-02T12:00:00',
        slug: 'test-post',
        status: 'publish',
        type: 'post',
        link: 'https://example.com/test-post',
        author: 1,
        featured_media: 2,
        categories: [],
        tags: [],
      },
      categories: [],
      tags: [],
      featuredMedia: {
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
      },
      author: {
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
      },
    };

    const html = await renderer.renderPost(postData);

    expect(html).toContain('<div class="featured-image">');
    expect(html).toContain('<img src="https://example.com/wp-content/uploads/test-image.jpg"');
    expect(html).toContain('alt="Test image alt text"');
    expect(html).toContain('width="600"');
  });

  it('should include categories and tags when available', async () => {
    const postData: PostMetadata = {
      post: {
        id: 1,
        title: { rendered: 'Test Post' },
        content: { rendered: '<p>Content with categories and tags.</p>', protected: false },
        excerpt: { rendered: '<p>Test excerpt</p>', protected: false },
        date: '2023-01-01T12:00:00',
        modified: '2023-01-02T12:00:00',
        slug: 'test-post',
        status: 'publish',
        type: 'post',
        link: 'https://example.com/test-post',
        author: 1,
        featured_media: 0,
        categories: [3, 4],
        tags: [5, 6],
      },
      categories: [
        {
          id: 3,
          name: 'Category 1',
          slug: 'category-1',
          description: '',
          count: 5,
          link: 'http://example.com/category-1',
          parent: 0,
        },
        {
          id: 4,
          name: 'Category 2',
          slug: 'category-2',
          description: '',
          count: 3,
          link: 'http://example.com/category-2',
          parent: 0,
        },
      ],
      tags: [
        {
          id: 5,
          name: 'Tag 1',
          slug: 'tag-1',
          description: '',
          count: 2,
          link: 'http://example.com/tags/tag-1',
        },
        {
          id: 6,
          name: 'Tag 2',
          slug: 'tag-2',
          description: '',
          count: 4,
          link: 'http://example.com/tags/tag-2',
        },
      ],
      author: {
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
      },
    };

    const html = await renderer.renderPost(postData);

    expect(html).toContain(
      '<em>Categories: <a href="http://example.com/category-1">Category 1</a>, <a href="http://example.com/category-2">Category 2</a></em>'
    );
    expect(html).toContain(
      '<em>Tags: <a href="http://example.com/tags/tag-1">Tag 1</a>, <a href="http://example.com/tags/tag-2">Tag 2</a></em>'
    );
  });

  it('should handle Gutenberg blocks when available', async () => {
    const postData: PostMetadata = {
      post: {
        id: 1,
        title: { rendered: 'Test Post with Blocks' },
        content: { rendered: '<p>Fallback content</p>', protected: false },
        excerpt: { rendered: '<p>Test excerpt</p>', protected: false },
        date: '2023-01-01T12:00:00',
        modified: '2023-01-02T12:00:00',
        slug: 'test-post',
        status: 'publish',
        type: 'post',
        link: 'https://example.com/test-post',
        author: 1,
        featured_media: 0,
        categories: [],
        tags: [],
        blocks: [
          {
            name: 'core/paragraph',
            attributes: {
              content: 'This is a paragraph block.',
            },
            innerBlocks: [],
          },
          {
            name: 'core/heading',
            attributes: { level: 2, content: 'This is a heading' },
            innerBlocks: [],
          },
          {
            name: 'core/list',
            attributes: {
              ordered: false,
              items: [{ content: 'Item 1' }, { content: 'Item 2' }],
            },
            innerBlocks: [
              { name: 'core/list-item', attributes: { content: 'Item 1' } },
              { name: 'core/list-item', attributes: { content: 'Item 2' } },
            ],
          },
          {
            name: 'core/quote',
            attributes: {},
            innerBlocks: [
              {
                name: 'core/paragraph',
                attributes: {
                  content: 'This is a quote',
                  dropCap: false,
                },
              },
            ],
          },
          {
            name: 'core/image',
            attributes: {
              url: 'https://example.com/image.jpg',
              alt: 'Example image',
            },
            innerBlocks: [],
          },
        ],
      },
      categories: [],
      tags: [],
      author: {
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
      },
    };

    const html = await renderer.renderPost(postData);

    expect(html).toContain('<p>This is a paragraph block.</p>');
    expect(html).toContain('<h2>This is a heading</h2>');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>Item 1</li>');
    expect(html).toContain('<li>Item 2</li>');
    expect(html).toContain('<blockquote>');
    expect(html).toContain('<p>This is a quote</p>');
    expect(html).toContain('<figure class="image">');
    expect(html).toContain('<img src="https://example.com/image.jpg" alt="Example image" />');
    expect(html).not.toContain('Fallback content');
  });

  it('should handle table blocks correctly', async () => {
    const postData: PostMetadata = {
      post: {
        id: 1,
        title: { rendered: 'Test Table' },
        content: { rendered: '<p>Fallback content</p>', protected: false },
        excerpt: { rendered: '<p>Test excerpt</p>', protected: false },
        date: '2023-01-01T12:00:00',
        modified: '2023-01-02T12:00:00',
        slug: 'test-post',
        status: 'publish',
        type: 'post',
        link: 'https://example.com/test-post',
        author: 1,
        featured_media: 0,
        categories: [],
        tags: [],
        blocks: [
          {
            name: 'core/table',
            attributes: {
              caption: 'Sample Table',
              head: [
                {
                  cells: [
                    { tag: 'th', content: 'Header 1' },
                    { tag: 'th', content: 'Header 2' },
                  ],
                },
              ],
              body: [
                {
                  cells: [
                    { tag: 'td', content: 'Row 1, Cell 1' },
                    { tag: 'td', content: 'Row 1, Cell 2' },
                  ],
                },
                {
                  cells: [
                    { tag: 'td', content: 'Row 2, Cell 1' },
                    { tag: 'td', content: 'Row 2, Cell 2' },
                  ],
                },
              ],
              foot: [
                {
                  cells: [
                    { tag: 'td', content: 'Footer 1' },
                    { tag: 'td', content: 'Footer 2' },
                  ],
                },
              ],
            },
            innerBlocks: [],
          },
        ],
      },
      categories: [],
      tags: [],
      author: {
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
      },
    };

    const html = await renderer.renderPost(postData);

    expect(html).toContain('<table>');
    expect(html).toContain('<caption>Sample Table</caption>');
    expect(html).toContain('<thead>');
    expect(html).toContain('<th>Header 1</th>');
    expect(html).toContain('<tbody>');
    expect(html).toContain('<td>Row 1, Cell 1</td>');
    expect(html).toContain('<tfoot>');
    expect(html).toContain('<td>Footer 1</td>');
  });
});
