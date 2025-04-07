import { describe, it, expect } from 'vitest';
import { MarkdownRenderer } from './markdown-renderer';
import { PostMetadata } from './renderer.interface';

describe('MarkdownRenderer', () => {
  const renderer = new MarkdownRenderer();

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

    const markdown = await renderer.renderPost(postData);

    expect(markdown).toContain('# Test Post');
    expect(markdown).toContain('*By Test Author*');
    expect(markdown).toContain('This is a test paragraph.');
    expect(markdown).toContain('Another paragraph.');
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

    const markdown = await renderer.renderPost(postData);

    expect(markdown).toContain(
      '![Test image alt text](https://example.com/wp-content/uploads/test-image.jpg)'
    );
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
      ],
      tags: [
        { id: 5, name: 'Tag 1', slug: 'tag-1', description: '', count: 2, link: '' },
        { id: 6, name: 'Tag 2', slug: 'tag-2', description: '', count: 4, link: '' },
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

    const markdown = await renderer.renderPost(postData);

    expect(markdown).toContain('*Categories: Category 1, Category 2*');
    expect(markdown).toContain('*Tags: Tag 1, Tag 2*');
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

    const markdown = await renderer.renderPost(postData);

    expect(markdown).toContain('This is a paragraph block.');
    expect(markdown).toContain('## This is a heading');
    expect(markdown).toContain('- Item 1');
    expect(markdown).toContain('- Item 2');
    expect(markdown).toContain('> This is a quote');
    expect(markdown).toContain('![Example image](https://example.com/image.jpg)');
  });

  it('should properly decode HTML entities in content', async () => {
    const postData: PostMetadata = {
      post: {
        id: 1,
        title: { rendered: 'Test HTML Entities' },
        content: {
          rendered: `<p>We use a tech radar that mimic&#8217;s the format.</p>
          <p>The &#8220;radar&#8221; UI doesn&#8217;t lend itself to reading.</p>
          <p>Common entities: &amp; &lt; &gt; &quot; &#39; &apos;</p>
          <p>Special characters: &mdash; &ndash; &hellip; &bull;</p>
          <p>Numeric entities: &#8216; &#8217; &#8220; &#8221; &#8230; &#8226;</p>`,
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

    const markdown = await renderer.renderPost(postData);

    // Test apostrophes and quotes
    expect(markdown).toContain('We use a tech radar that mimic’s the format.');
    expect(markdown).toContain('The “radar” UI doesn’t lend itself to reading.');

    // Test common entities
    expect(markdown).toContain(`Common entities: & < > " ' '`);

    // Test special characters
    expect(markdown).toContain('Special characters: — – … •');

    // Test numeric entities
    expect(markdown).toContain('Numeric entities: ‘ ’ “ ” … •');
  });

  it('should insert correct newlines between paragraphs and lists', async () => {
    const postData: PostMetadata = {
      post: {
        id: 1,
        title: { rendered: 'Test Newlines' },
        content: {
          rendered: '...',
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
        blocks: [
          {
            name: 'core/paragraph',
            attributes: {
              content: 'This is the first paragraph.',
            },
            innerBlocks: [],
          },
          {
            name: 'core/list',
            attributes: {
              ordered: false,
            },
            innerBlocks: [
              { name: 'core/list-item', attributes: { content: 'List item 1' } },
              { name: 'core/list-item', attributes: { content: 'List item 2' } },
              { name: 'core/list-item', attributes: { content: 'List item 3' } },
            ],
          },
          {
            name: 'core/paragraph',
            attributes: {
              content: 'This is the second paragraph after the list.',
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

    const markdown = await renderer.renderPost(postData);

    // Check the content and spacing
    expect(markdown).toContain(
      [
        'This is the first paragraph.',
        '',
        '- List item 1',
        '- List item 2',
        '- List item 3',
        '',
        'This is the second paragraph after the list.',
      ].join('\n')
    );
  });
});
