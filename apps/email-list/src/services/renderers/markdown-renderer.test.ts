import { describe, it, expect } from 'vitest';
import { MarkdownRenderer, convertHtmlToMarkdown } from './markdown-renderer';
import { WPPost, PostWithMetadata } from '../wordpress-api';

// Base test post that can be extended for specific test cases
const baseTestPost: PostWithMetadata = {
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

describe('MarkdownRenderer', () => {
  const renderer = new MarkdownRenderer();

  it('should render a post title and content', async () => {
    const postData: PostWithMetadata = baseTestPost;

    const markdown = await renderer.renderPost(postData);

    expect(markdown).toContain('# Test Post');
    expect(markdown).toContain('*By Test Author*');
    expect(markdown).toContain('This is a test paragraph.');
    expect(markdown).toContain('Another paragraph.');
  });

  it('should include featured image when available', async () => {
    const postData: PostWithMetadata = {
      ...baseTestPost,
      post: {
        ...baseTestPost.post,
        content: { rendered: '<p>Content with image.</p>', protected: false },
        featured_media: 2,
      },
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
    };

    const markdown = await renderer.renderPost(postData);

    expect(markdown).toContain(
      '![Test image alt text](https://example.com/wp-content/uploads/test-image.jpg)'
    );
  });

  it('should include categories and tags when available', async () => {
    const postData: PostWithMetadata = {
      ...baseTestPost,
      post: {
        ...baseTestPost.post,
        content: { rendered: '<p>Content with categories and tags.</p>', protected: false },
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
    };

    const markdown = await renderer.renderPost(postData);

    expect(markdown).toContain('*Categories: Category 1, Category 2*');
    expect(markdown).toContain('*Tags: Tag 1, Tag 2*');
  });

  it('should handle Gutenberg blocks when available', async () => {
    const postData: PostWithMetadata = {
      ...baseTestPost,
      post: {
        ...baseTestPost.post,
        title: { rendered: 'Test Post with Blocks' },
        content: { rendered: '<p>Fallback content</p>', protected: false },
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
    };

    const markdown = await renderer.renderPost(postData);

    expect(markdown).toContain('This is a paragraph block.');
    expect(markdown).toContain('## This is a heading');
    expect(markdown).toContain('- Item 1');
    expect(markdown).toContain('- Item 2');
    expect(markdown).toContain('> This is a quote');
    expect(markdown).toContain('![Example image](https://example.com/image.jpg)');
    expect(markdown).not.toContain('Fallback content');
  });

  it('should insert correct newlines between paragraphs and lists', async () => {
    const postData: PostWithMetadata = {
      ...baseTestPost,
      post: {
        ...baseTestPost.post,
        title: { rendered: 'Test Newlines' },
        content: {
          rendered: '...',
          protected: false,
        },
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

  it('should render footnotes correctly', async () => {
    const paragraph1 = `This is a paragraph with a footnote<sup data-fn="abc" class="fn"><a href="#abc" id="abc-link">1</a></sup>.`;
    const paragraph2 = `Another paragraph with a footnote<sup data-fn="def" class="fn"><a href="#def" id="def-link">2</a></sup>.`;
    const postData: PostWithMetadata = {
      ...baseTestPost,
      post: {
        ...baseTestPost.post,
        content: {
          rendered: `<p>${paragraph1}</p><p>${paragraph2}</p>`,
          protected: false,
        },
        blocks: [
          {
            name: 'core/paragraph',
            attributes: {
              content: paragraph1,
            },
            innerBlocks: [],
          },
          {
            name: 'core/paragraph',
            attributes: {
              content: paragraph2,
            },
            innerBlocks: [],
          },
          {
            name: 'core/footnotes',
            attributes: {},
            innerBlocks: [],
          },
        ],
      },
      footnotes: [
        { id: 'abd', content: 'This is the first footnote.' },
        { id: 'def', content: 'This is the second footnote.' },
      ],
    };

    const markdown = await renderer.renderPost(postData);

    // Check that footnote references are converted to markdown format
    expect(markdown).toContain('This is a paragraph with a footnote[^1].');
    expect(markdown).toContain('Another paragraph with a footnote[^2].');

    // Check that footnotes section is included
    expect(markdown).toContain('## Footnotes');
    expect(markdown).toContain('1: This is the first footnote.');
    expect(markdown).toContain('2: This is the second footnote.');
  });

  it('should handle footnotes with HTML content', async () => {
    const paragraph1 = `This is a paragraph with a footnote<sup data-fn="abc" class="fn"><a href="#abc" id="abc-link">1</a></sup>.`;
    const postData: PostWithMetadata = {
      ...baseTestPost,
      post: {
        ...baseTestPost.post,
        content: {
          rendered: `<p>${paragraph1}</p>`,
          protected: false,
        },
        blocks: [
          {
            name: 'core/paragraph',
            attributes: {
              content: paragraph1,
            },
            innerBlocks: [],
          },
          {
            name: 'core/footnotes',
            attributes: {},
            innerBlocks: [],
          },
        ],
      },
      footnotes: [
        {
          id: 'abd',
          content:
            'This is a <strong>formatted</strong> footnote with a <a href="https://example.com">link</a>.',
        },
      ],
    };

    const markdown = await renderer.renderPost(postData);

    // Check that footnote references are converted to markdown format
    expect(markdown).toContain('This is a paragraph with a footnote[^1].');

    // Check that footnotes section is included with HTML converted to markdown
    expect(markdown).toContain('## Footnotes');
    expect(markdown).toContain(
      '1: This is a **formatted** footnote with a [link](https://example.com).'
    );
  });

  it('should not render footnotes section when no footnotes are present', async () => {
    const postData: PostWithMetadata = {
      ...baseTestPost,
      post: {
        ...baseTestPost.post,
        content: {
          rendered: '<p>This is a paragraph without footnotes.</p>',
          protected: false,
        },
        blocks: [
          {
            name: 'core/paragraph',
            attributes: {
              content: 'This is a paragraph without footnotes.',
            },
            innerBlocks: [],
          },
          {
            name: 'core/footnotes',
            attributes: {},
            innerBlocks: [],
          },
        ],
      },
    };

    const markdown = await renderer.renderPost(postData);

    // Check that the footnotes section is not included
    expect(markdown).not.toContain('## Footnotes');
  });

  it('should render more from the blog section', () => {
    const posts = [
      {
        id: 1,
        title: { rendered: 'Previous Post 1' },
        excerpt: { rendered: '<p>This is the excerpt for post 1.</p>', protected: false },
        content: {
          rendered: '<p>many words</p>'.repeat(150),
          protected: false,
        },
        date: '2023-01-01T12:00:00',
        link: 'https://example.com/previous-post-1',
      } as WPPost,
      {
        id: 2,
        title: { rendered: 'Previous Post 2' },
        excerpt: { rendered: '<p>This is the excerpt for post 2.</p>', protected: false },
        content: { rendered: '<p>This is the full content for post 2.</p>', protected: false },
        date: '2023-01-02T12:00:00',
        link: 'https://example.com/previous-post-2',
      } as WPPost,
    ];

    const markdown = renderer.renderMoreFromTheBlog(posts);

    // Check the section title
    expect(markdown).toContain('## More from the blog');

    // Check that each post is included
    expect(markdown).toContain('### [Previous Post 1](https://example.com/previous-post-1)');
    expect(markdown).toContain('### [Previous Post 2](https://example.com/previous-post-2)');

    // Check that excerpts are included
    expect(markdown).toContain('This is the excerpt for post 1.');
    expect(markdown).toContain('This is the full content for post 2.');

    // Check that dates are formatted
    expect(markdown).toContain('Published on January 1, 2023');
    expect(markdown).toContain('Published on January 2, 2023');

    // Check that read more links are included
    expect(markdown).toContain('Read more: https://example.com/previous-post-1');
    expect(markdown).not.toContain('Read more: https://example.com/previous-post-2');
  });
});

describe('convertHtmlToMarkdown', () => {
  it('should do basic headers and paragraphs', () => {
    const html = `<h1>Title</h1><p>Paragraph 1</p><p>Paragraph 2</p>`;
    const markdown = convertHtmlToMarkdown(html);

    expect(markdown).toContain('# Title\n\nParagraph 1\n\nParagraph 2');
  });

  it('should convert unordered lists to markdown format', () => {
    const html = `<ul><li>Item 1</li><li>Item 2</li></ul>`;
    const markdown = convertHtmlToMarkdown(html);

    expect(markdown).toContain('- Item 1\n- Item 2');
  });

  it('should convert ordered lists to markdown format', () => {
    const html = `<ol><li>Item 1</li><li>Item 2</li></ol>`;
    const markdown = convertHtmlToMarkdown(html);

    expect(markdown).toContain('1. Item 1\n2. Item 2');
  });

  it('should render bold and italics', () => {
    const html = `<strong>Strong Text</strong><b>Bold Text</b><em>Emphasised Text</em><i>Italic Text</i>`;
    const markdown = convertHtmlToMarkdown(html);

    expect(markdown).toContain('**Strong Text**');
    expect(markdown).toContain('**Bold Text**');
    expect(markdown).toContain('*Emphasised Text*');
    expect(markdown).toContain('*Italic Text*');
  });

  it('should handle links', () => {
    const html = `<a href="https://example.com">Example Link</a>`;
    const markdown = convertHtmlToMarkdown(html);

    expect(markdown).toContain('[Example Link](https://example.com)');

    const html2 = `<a href="https://example.com" id="123">Example Link</a>`;
    const markdown2 = convertHtmlToMarkdown(html2);

    expect(markdown2).toContain('[Example Link](https://example.com)');
  });

  it('should strip other html', () => {
    const html = `<div><p>Paragraph 1</p><p>Paragraph 2</p><script>alert(0);</script></div>`;
    const markdown = convertHtmlToMarkdown(html);

    expect(markdown).toContain('Paragraph 1\n\nParagraph 2');
  });

  it('should properly decode HTML entities in content', async () => {
    const html = `<p>We use a tech radar that mimic&#8217;s the format.</p>
    <p>The &#8220;radar&#8221; UI doesn&#8217;t lend itself to reading.</p>
    <p>Common entities: &amp; &lt; &gt; &quot; &#39; &apos;</p>
    <p>Special characters: &mdash; &ndash; &hellip; &bull;</p>
    <p>Numeric entities: &#8216; &#8217; &#8220; &#8221; &#8230; &#8226;</p>`;

    const markdown = convertHtmlToMarkdown(html);

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
});
