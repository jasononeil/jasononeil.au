import { describe, it, expect } from 'vitest';
import {
  HtmlRenderer,
  renderBlock,
  renderListBlock,
  renderEmbedBlock,
  renderImageBlock,
  renderQuoteBlock,
  renderTableBlock,
  renderVideoBlock,
  renderGalleryBlock,
  renderHeadingBlock,
  renderParagraphBlock,
  renderPullquoteBlock,
  renderSeparatorBlock,
  renderPreformattedBlock,
  renderFootnotesBlock,
} from './html-renderer';
import { WPPost, PostWithMetadata } from '../wordpress-api';
import { FootnotesBlock } from '@/types/wp-blocks';

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

describe('HtmlRenderer', () => {
  const renderer = new HtmlRenderer();

  it('should render a post title and content', async () => {
    const postData: PostWithMetadata = {
      ...baseTestPost,
    };

    const html = await renderer.renderPost(postData);

    expect(html).toContain('<h1>Test Post</h1>');
    expect(html).toContain('<em>By Test Author</em>');
    expect(html).toContain('<p>This is a test paragraph.</p>');
    expect(html).toContain('<p>Another paragraph.</p>');
    expect(html).toContain('<a href="https://example.com/test-post">View original post</a>');
  });

  it('should include featured image when available', async () => {
    const postData: PostWithMetadata = {
      ...baseTestPost,
      post: {
        ...baseTestPost.post,
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

    const html = await renderer.renderPost(postData);

    expect(html).toContain('<div class="featured-image">');
    expect(html).toContain('<img src="https://example.com/wp-content/uploads/test-image.jpg"');
    expect(html).toContain('alt="Test image alt text"');
    expect(html).toContain('width="600"');
  });

  it('should include categories and tags when available', async () => {
    const postData: PostWithMetadata = {
      ...baseTestPost,
      post: {
        ...baseTestPost.post,
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
    const postData: PostWithMetadata = {
      ...baseTestPost,
      post: {
        ...baseTestPost.post,
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
        ],
      },
    };

    const html = await renderer.renderPost(postData);

    expect(html).toContain('<p>This is a paragraph block.</p>');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>Item 1</li>');
    expect(html).toContain('<li>Item 2</li>');
    expect(html).not.toContain('Fallback content');
  });

  it('should render footnotes when available', async () => {
    const postData: PostWithMetadata = {
      ...baseTestPost,
      post: {
        ...baseTestPost.post,
        content: {
          rendered: '<p>Content with footnotes<sup id="fnref1"><a href="#fn1">1</a></sup>.</p>',
          protected: false,
        },
        blocks: [
          {
            name: 'core/paragraph',
            attributes: {
              content:
                'This is a paragraph with a footnote<sup id="fn1-link"><a href="#fn1">1</a></sup>.',
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
          id: 'fn1',
          content: 'This is the footnote content.',
        },
      ],
    };

    const html = await renderer.renderPost(postData);

    expect(html).toContain(
      '<p>This is a paragraph with a footnote<sup id="fn1-link"><a href="#fn1">1</a></sup>.</p>'
    );
    expect(html).toContain('<div class="footnotes">');
    expect(html).toContain('<h2>Footnotes</h2>');
    expect(html).toContain('<ol>');
    expect(html).toContain(
      '<li id="fn1">This is the footnote content. <a href="#fn1-link" class="footnote-backref">↩</a></li>'
    );
  });

  it('should render "More from the blog" section', () => {
    const posts: WPPost[] = [
      {
        id: 1,
        title: { rendered: 'Previous Post 1' },
        content: { rendered: '<p>many words</p>'.repeat(150), protected: false },
        excerpt: { rendered: '<p>Excerpt of previous post 1.</p>', protected: false },
        date: '2023-01-01T12:00:00',
        modified: '2023-01-02T12:00:00',
        slug: 'previous-post-1',
        status: 'publish',
        type: 'post',
        link: 'https://example.com/previous-post-1',
        author: 1,
        featured_media: 0,
        categories: [],
        tags: [],
      },
      {
        id: 2,
        title: { rendered: 'Previous Post 2' },
        content: { rendered: '<p>Content of previous post 2.</p>', protected: false },
        excerpt: { rendered: '<p>Excerpt of previous post 2.</p>', protected: false },
        date: '2022-12-15T10:00:00',
        modified: '2022-12-16T10:00:00',
        slug: 'previous-post-2',
        status: 'publish',
        type: 'post',
        link: 'https://example.com/previous-post-2',
        author: 1,
        featured_media: 0,
        categories: [],
        tags: [],
      },
    ];

    const html = renderer.renderMoreFromTheBlog(posts);

    expect(html).toContain('<div class="more-from-blog">');
    expect(html).toContain('<h2>More from the blog</h2>');
    expect(html).toContain(
      '<h3><a href="https://example.com/previous-post-1">Previous Post 1</a></h3>'
    );
    expect(html).toContain(
      '<h3><a href="https://example.com/previous-post-2">Previous Post 2</a></h3>'
    );
    expect(html).toContain('<p class="post-date"><em>Published on January 1, 2023</em></p>');
    expect(html).toContain('<p class="post-date"><em>Published on December 15, 2022</em></p>');
    expect(html).toContain('<div class="post-excerpt"><p>Excerpt of previous post 1.</p></div>');
    expect(html).toContain('<div class="post-content"><p>Content of previous post 2.</p></div>');
    expect(html).toContain('<a href="https://example.com/previous-post-1">Read more...</a>');
    expect(html).not.toContain('<a href="https://example.com/previous-post-2">Read more...</a>');
  });

  describe('renderBlock', () => {
    it('should work for a basic block like paragraph', () => {
      const html = renderBlock(
        {
          name: 'core/paragraph',
          attributes: {
            content: 'This is a <em>paragraph</em> block.',
          },
          innerBlocks: [],
        },
        baseTestPost
      );
      expect(html).toContain('<p>This is a <em>paragraph</em> block.</p>');
    });

    it('should throw on unknown block types', () => {
      expect(() =>
        renderBlock(
          {
            // @ts-expect-error "this is a bogus block type that our schema/types should protect against"
            name: 'core/super-amazing-block-that-is-unknown',
            attributes: {},
            innerBlocks: [],
          },
          baseTestPost
        )
      ).toThrowError('Unknown block type: core/super-amazing-block-that-is-unknown');
    });
  });

  describe('renderParagraphBlock', () => {
    it('should render correctly', () => {
      const html = renderParagraphBlock({
        name: 'core/paragraph',
        attributes: {
          content: 'This is a <em>paragraph</em> block.',
        },
        innerBlocks: [],
      });
      expect(html).toContain('<p>This is a <em>paragraph</em> block.</p>');
    });
  });

  describe('renderHeadingBlock', () => {
    it('should render correctly', () => {
      const html = renderHeadingBlock({
        name: 'core/heading',
        attributes: {
          content: 'This is a heading',
          level: 2,
        },
        innerBlocks: [],
      });
      expect(html).toContain('<h2>This is a heading</h2>');
    });
  });

  describe('renderPreformattedBlock', () => {
    it('should render correctly', () => {
      const html = renderPreformattedBlock({
        name: 'core/preformatted',
        attributes: {
          content: 'This is preformatted text.',
        },
        innerBlocks: [],
      });
      expect(html).toContain('<pre>This is preformatted text.</pre>');
    });
  });

  describe('renderImageBlock', () => {
    it('should render correctly', () => {
      const html = renderImageBlock({
        name: 'core/image',
        attributes: {
          url: 'https://example.com/image.jpg',
          alt: 'Test image',
          caption: 'This is a caption',
        },
        innerBlocks: [],
      });
      expect(html).toContain('<figure class="image">');
      expect(html).toContain('<img src="https://example.com/image.jpg" alt="Test image"');
      expect(html).toContain('<figcaption>This is a caption</figcaption>');
    });
  });

  describe('renderListBlock', () => {
    it('should render correctly', () => {
      const html = renderListBlock({
        name: 'core/list',
        attributes: {
          ordered: false,
          items: [{ content: 'Item 1' }, { content: 'Item 2' }],
        },
        innerBlocks: [
          { name: 'core/list-item', attributes: { content: 'Item 1' } },
          { name: 'core/list-item', attributes: { content: 'Item 2' } },
        ],
      });
      expect(html).toContain('<ul>');
      expect(html).toContain('<li>Item 1</li>');
      expect(html).toContain('<li>Item 2</li>');
    });

    it('should work with the old style list values', () => {
      const html = renderListBlock({
        name: 'core/list',
        attributes: {
          ordered: false,
          values: '<li>Item 1</li><li>Item 2</li>',
        },
        innerBlocks: [],
      });
      expect(html).toContain('<ul>');
      expect(html).toContain('<li>Item 1</li>');
      expect(html).toContain('<li>Item 2</li>');
    });
  });

  describe('renderQuoteBlock', () => {
    it('should render correctly', () => {
      const html = renderQuoteBlock(
        {
          name: 'core/quote',
          attributes: {
            value: 'This is a quote.',
            citation: 'Test Citation',
          },
          innerBlocks: [],
        },
        baseTestPost
      );
      expect(html).toContain('<blockquote>');
      expect(html).toContain('This is a quote.');
      expect(html).toContain('<cite>Test Citation</cite>');
    });
  });

  describe('renderPullquoteBlock', () => {
    it('should render correctly', () => {
      const html = renderPullquoteBlock(
        {
          name: 'core/pullquote',
          attributes: {
            value: 'This is a pullquote.',
          },
          innerBlocks: [],
        },
        baseTestPost
      );
      expect(html).toContain('<figure class="pullquote">');
      expect(html).toContain('<blockquote>');
      expect(html).toContain('This is a pullquote.');
    });
  });

  describe('renderSeparatorBlock', () => {
    it('should render correctly', () => {
      const html = renderSeparatorBlock();
      expect(html).toContain('<hr />');
    });
  });

  describe('renderTableBlock', () => {
    it('should render correctly', () => {
      const html = renderTableBlock({
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
      });
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

  describe('renderGalleryBlock', () => {
    it('should throw if neither innerBlocks or attributes.images is set', () => {
      expect(() =>
        renderGalleryBlock(
          {
            name: 'core/gallery',
            attributes: {
              ids: [],
            },
          },
          baseTestPost
        )
      ).toThrowError('Gallery has neither innerBlocks or attributes.images defined');
    });

    it('should render with attributes.images', () => {
      const html = renderGalleryBlock(
        {
          name: 'core/gallery',
          attributes: {
            ids: [],
            images: [
              {
                url: 'https://example.com/image1.jpg',
                alt: 'Image 1',
                caption: 'Caption 1',
              },
              {
                url: 'https://example.com/image2.jpg',
                alt: 'Image 2',
              },
            ],
          },
          innerBlocks: undefined,
        },
        baseTestPost
      );
      expect(html).toContain('<div class="gallery">');
      expect(html).toContain('<figure class="image">');
      expect(html).toContain('<img src="https://example.com/image1.jpg"');
      expect(html).toContain('alt="Image 1"');
      expect(html).toContain('<figcaption>Caption 1');
      expect(html).toContain('<img src="https://example.com/image2.jpg"');
      expect(html).toContain('alt="Image 2"');
    });

    it('should render when innerBlock images are set', () => {
      const html = renderGalleryBlock(
        {
          name: 'core/gallery',
          attributes: {
            ids: [],
            images: [],
          },
          innerBlocks: [
            {
              name: 'core/image',
              attributes: {
                url: 'https://example.com/image1.jpg',
                alt: 'Image 1',
                caption: 'Caption 1',
              },
              innerBlocks: [],
            },
            {
              name: 'core/image',
              attributes: {
                url: 'https://example.com/image2.jpg',
                alt: 'Image 2',
              },
              innerBlocks: [],
            },
          ],
        },
        baseTestPost
      );
      expect(html).toContain('<div class="gallery">');
      expect(html).toContain('<figure class="image">');
      expect(html).toContain('<img src="https://example.com/image1.jpg"');
      expect(html).toContain('alt="Image 1"');
      expect(html).toContain('<figcaption>Caption 1');
      expect(html).toContain('<img src="https://example.com/image2.jpg"');
      expect(html).toContain('alt="Image 2"');
    });
  });

  describe('renderVideoBlock', () => {
    it('should render correctly', () => {
      const html = renderVideoBlock({
        name: 'core/video',
        attributes: {
          src: 'https://example.com/video1.mp4',
          caption: 'This is a video caption',
        },
        innerBlocks: [],
      });
      expect(html).toContain('<figure class="video">');
      expect(html).toContain('<video controls src="https://example.com/video1.mp4"></video>');
      expect(html).toContain('<figcaption>This is a video caption</figcaption>');
    });
  });

  describe('renderEmbedBlock', () => {
    it('should render correctly', () => {
      const html = renderEmbedBlock({
        name: 'core/embed',
        attributes: {
          url: 'https://example.com/embed-url',
        },
        innerBlocks: [],
      });
      expect(html).toContain(
        '<p><a href="https://example.com/embed-url">View embedded content</a></p>'
      );
    });
  });

  describe('renderFootnotesBlock', () => {
    it('should render footnotes correctly', () => {
      const block: FootnotesBlock = {
        name: 'core/footnotes',
        attributes: {},
        innerBlocks: [],
      };

      const postData: PostWithMetadata = {
        post: {
          id: 1,
          title: { rendered: 'Test Post' },
          content: { rendered: '<p>Content</p>', protected: false },
          excerpt: { rendered: '<p>Excerpt</p>', protected: false },
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
        footnotes: [
          { id: 'fn1', content: 'First footnote' },
          { id: 'fn2', content: 'Second footnote' },
        ],
      };

      const html = renderFootnotesBlock(block, postData);

      expect(html).toContain('<div class="footnotes">');
      expect(html).toContain('<h2>Footnotes</h2>');
      expect(html).toContain('<ol>');
      expect(html).toContain(
        '<li id="fn1">First footnote <a href="#fn1-link" class="footnote-backref">↩</a></li>'
      );
      expect(html).toContain(
        '<li id="fn2">Second footnote <a href="#fn2-link" class="footnote-backref">↩</a></li>'
      );
    });

    it('should return empty string when no footnotes are available', () => {
      const block: FootnotesBlock = {
        name: 'core/footnotes',
        attributes: {},
        innerBlocks: [],
      };

      const postData: PostWithMetadata = {
        post: {
          id: 1,
          title: { rendered: 'Test Post' },
          content: { rendered: '<p>Content</p>', protected: false },
          excerpt: { rendered: '<p>Excerpt</p>', protected: false },
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
        footnotes: [],
      };

      const html = renderFootnotesBlock(block, postData);
      expect(html).toBe('');
    });
  });
});
