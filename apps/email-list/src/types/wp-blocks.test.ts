import { describe, it, expect } from 'bun:test';
import {
  parseBlock,
  parseBlocks,
  isParagraphBlock,
  isHeadingBlock,
  isImageBlock,
  isListBlock,
  isQuoteBlock,
  isPullquoteBlock,
  isSeparatorBlock,
  isEmbedBlock,
  isVideoBlock,
  isTableBlock,
  isGalleryBlock,
  isFootnotesBlock,
  isReusableBlock,
  parseFootnotes,
} from './wp-blocks';

describe('WordPress Block Decoders', () => {
  describe('core/paragraph', () => {
    it('should parse a paragraph block', () => {
      const block = {
        name: 'core/paragraph',
        attributes: {
          content:
            'I\'m reading "<a href="https://www.plough.com/en/topics/culture/holidays/easter-readings/bread-and-wine">Bread and Wine: <em>Readings for Lent and Easter</em></a>" this lent and there\'s another reading from <em>The Gospel in Solentiname</em> by Ernesto Cardenal. <a href="https://jasononeil.au/2024/01/07/the-wise-men-and-christmas-gifts/?swcfpc=1">I\'ve quoted a similar reading before from their advent book</a>. They\'re beautiful conversations.',
          dropCap: false,
        },
      };

      const parsed = parseBlock(block);
      expect(parsed).toEqual(block);
      expect(isParagraphBlock(parsed)).toBe(true);
      if (isParagraphBlock(parsed)) {
        expect(parsed.attributes.content).toBe(block.attributes.content);
        expect(parsed.attributes.dropCap).toBe(false);
      }
    });

    it('should handle paragraph with missing dropCap', () => {
      const block = {
        name: 'core/paragraph',
        attributes: {
          content: 'Simple paragraph without dropCap specified',
        },
      };

      const parsed = parseBlock(block);
      expect(parsed).toEqual(block);
      expect(isParagraphBlock(parsed)).toBe(true);
      if (isParagraphBlock(parsed)) {
        expect(parsed.attributes.dropCap).toBeUndefined();
      }
    });
  });

  describe('core/heading', () => {
    it('should parse a heading block', () => {
      const block = {
        name: 'core/heading',
        attributes: {
          content: 'The future is bi-vocational',
          level: 3,
        },
      };

      const parsed = parseBlock(block);
      expect(parsed).toEqual(block);
      expect(isHeadingBlock(parsed)).toBe(true);
      if (isHeadingBlock(parsed)) {
        expect(parsed.attributes.content).toBe('The future is bi-vocational');
        expect(parsed.attributes.level).toBe(3);
      }
    });
  });

  describe('core/image', () => {
    it('should parse an image block', () => {
      const block = {
        name: 'core/image',
        attributes: {
          alt: 'Photo: a wide photo of the bush landscape and the blue skies. You can see the Mundaring Weir (a giant dam) in the distance. It looks smaller in the photo than it did in real life.',
          caption: 'One of the views from the hike',
          href: 'https://jasono.co/wp-content/uploads/2023/05/img_1254-1-scaled.jpg',
          id: 902,
          linkDestination: 'media',
          sizeSlug: 'large',
          url: 'https://jasono.co/wp-content/uploads/2023/05/img_1254-1-768x1024.jpg',
          width: 768,
          height: 1024,
        },
      };

      const parsed = parseBlock(block);
      expect(parsed).toEqual(block);
      expect(isImageBlock(parsed)).toBe(true);
      if (isImageBlock(parsed)) {
        expect(parsed.attributes.url).toBe(
          'https://jasono.co/wp-content/uploads/2023/05/img_1254-1-768x1024.jpg'
        );
        expect(parsed.attributes.alt).toContain('Photo: a wide photo of the bush landscape');
      }
    });
  });

  describe('core/list', () => {
    it('should parse a list block with list items', () => {
      const block = {
        name: 'core/list',
        attributes: {
          ordered: false,
          values: '',
        },
        innerBlocks: [
          {
            name: 'core/list-item',
            attributes: {
              content:
                'His birth story was pretty unexpected (which we talk about every Christmas. I hear a lot about this one!)',
            },
          },
          {
            name: 'core/list-item',
            attributes: {
              content: 'His family left their home and fled to Egypt as refugees',
            },
          },
        ],
      };

      const parsed = parseBlock(block);
      expect(parsed).toEqual(block);
      expect(isListBlock(parsed)).toBe(true);
      if (isListBlock(parsed)) {
        expect(parsed.attributes.ordered).toBe(false);
        expect(parsed.innerBlocks?.length).toBe(2);
        expect(parsed.innerBlocks?.[0].name).toBe('core/list-item');
        expect(parsed.innerBlocks?.[0].attributes.content).toContain(
          'His birth story was pretty unexpected'
        );
      }
    });
  });

  describe('core/quote', () => {
    it('should parse a quote block with paragraphs', () => {
      const block = {
        name: 'core/quote',
        attributes: {
          citation:
            '<a href="https://en.wikipedia.org/wiki/The_Gospel_in_Solentiname">The Gospel in Solentiname</a>. I read it in "Bread and Wine: Readings for Lent and Easter".',
          value: '',
        },
        innerBlocks: [
          {
            name: 'core/paragraph',
            attributes: {
              content: 'William: But all that perfume. And the bottle. The alabaster bottle!',
              dropCap: false,
            },
          },
          {
            name: 'core/paragraph',
            attributes: {
              content:
                "Padré: The alabaster bottle was sealed, and it had to be broken to use the perfume. The perfume could be used only once. And the Gospel says the whole house was filled with the fragrance of nard. It's believed that nard was an ointment that came from India.",
              dropCap: false,
            },
          },
        ],
      };

      const parsed = parseBlock(block);
      expect(parsed).toEqual(block);
      expect(isQuoteBlock(parsed)).toBe(true);
      if (isQuoteBlock(parsed)) {
        expect(parsed.attributes.citation).toContain('The Gospel in Solentiname');
        expect(parsed.innerBlocks?.length).toBe(2);
        expect(parsed.innerBlocks?.[0].name).toBe('core/paragraph');
        expect(parsed.innerBlocks?.[0].attributes.content).toContain(
          'William: But all that perfume'
        );
      }
    });
  });

  describe('core/pullquote', () => {
    it('should parse a pullquote block', () => {
      const block = {
        name: 'core/pullquote',
        attributes: {
          value:
            "Consistently offering different prices for the same product causes me to lose trust in the company, feel like I'm being cheated, and hesitate to pay, because I'm unsure of if there will be a better price tomorrow.",
        },
      };

      const parsed = parseBlock(block);
      expect(parsed).toEqual(block);
      expect(isPullquoteBlock(parsed)).toBe(true);
      if (isPullquoteBlock(parsed)) {
        expect(parsed.attributes.value).toContain('Consistently offering different prices');
      }
    });
  });

  describe('core/separator', () => {
    it('should parse a separator block', () => {
      const block = {
        name: 'core/separator',
        attributes: {
          opacity: 'alpha-channel',
        },
      };

      const parsed = parseBlock(block);
      expect(parsed).toEqual(block);
      expect(isSeparatorBlock(parsed)).toBe(true);
      if (isSeparatorBlock(parsed)) {
        expect(parsed.attributes.opacity).toBe('alpha-channel');
      }
    });
  });

  describe('core/embed', () => {
    it('should parse an embed block', () => {
      const block = {
        name: 'core/embed',
        attributes: {
          allowResponsive: true,
          className: 'wp-embed-aspect-16-9 wp-has-aspect-ratio',
          previewable: true,
          providerNameSlug: 'youtube',
          responsive: true,
          type: 'video',
          url: 'https://www.youtube.com/watch?v=jYhE7HNvA8E',
        },
      };

      const parsed = parseBlock(block);
      expect(parsed).toEqual(block);
      expect(isEmbedBlock(parsed)).toBe(true);
      if (isEmbedBlock(parsed)) {
        expect(parsed.attributes.url).toBe('https://www.youtube.com/watch?v=jYhE7HNvA8E');
        expect(parsed.attributes.providerNameSlug).toBe('youtube');
      }
    });
  });

  describe('core/video', () => {
    it('should parse a video block', () => {
      const block = {
        name: 'core/video',
        attributes: {
          caption:
            'A screen recording of my using a command line app. In the screen recording I type a prompt. You can then see a browser open, perform a web search, and open a web page. In the background the terminal is spinning information. Once it finishes the terminal prints the answer. The dialogue is below.',
          controls: '',
          id: 936,
          loop: '',
          preload: 'auto',
          src: 'https://jasono.co/wp-content/uploads/2023/06/screen-chatter-002.mp4',
          tracks: [],
        },
      };

      const parsed = parseBlock(block);
      expect(parsed).toEqual(block);
      expect(isVideoBlock(parsed)).toBe(true);
      if (isVideoBlock(parsed)) {
        expect(parsed.attributes.src).toBe(
          'https://jasono.co/wp-content/uploads/2023/06/screen-chatter-002.mp4'
        );
        expect(parsed.attributes.caption).toContain(
          'A screen recording of my using a command line app'
        );
      }
    });
  });

  describe('core/table', () => {
    it('should parse a table block', () => {
      const block = {
        name: 'core/table',
        attributes: {
          body: [
            {
              cells: [
                {
                  content: '',
                  tag: 'td',
                },
                {
                  content: '% of ARR',
                  tag: 'td',
                },
              ],
            },
            {
              cells: [
                {
                  content: 'Accounts with >10% IE11 usage',
                  tag: 'td',
                },
                {
                  content: '18.6%',
                  tag: 'td',
                },
              ],
            },
          ],
          caption:
            "This table shows a huge portion of our revenue came from companies still with over 10% IE11 usage. We needed to make sure whatever our plan was, we didn't upset this many customers.",
          foot: [],
          hasFixedLayout: true,
          head: [],
        },
      };

      const parsed = parseBlock(block);
      expect(parsed).toEqual(block);
      expect(isTableBlock(parsed)).toBe(true);
      if (isTableBlock(parsed)) {
        expect(parsed.attributes.body.length).toBe(2);
        expect(parsed.attributes.body[1].cells[0].content).toBe('Accounts with >10% IE11 usage');
        expect(parsed.attributes.caption).toContain(
          'This table shows a huge portion of our revenue'
        );
      }
    });
  });

  describe('core/gallery', () => {
    it('should parse a gallery block with image blocks', () => {
      const block = {
        name: 'core/gallery',
        attributes: {
          allowResize: false,
          columns: 1,
          fixedHeight: true,
          ids: [],
          imageCrop: true,
          images: [],
          linkTarget: '_blank',
          linkTo: 'media',
          randomOrder: false,
          shortCodeTransforms: [],
          sizeSlug: 'large',
        },
        innerBlocks: [
          {
            name: 'core/image',
            attributes: {
              alt: 'Photo of a childrens book, illustrating the activity with cartoon characters, coloured dots and arrows.',
              caption:
                'Visualising the worry on each finger tip, and a "peaceful spot" on your palm.',
              href: 'https://jasono.co/wp-content/uploads/2024/02/img_2439.jpg',
              id: 1033,
              linkDestination: 'media',
              linkTarget: '_blank',
              rel: 'noopener',
              sizeSlug: 'large',
              url: 'https://jasono.co/wp-content/uploads/2024/02/img_2439-1024x599.jpg',
              width: 1024,
              height: 599,
            },
          },
        ],
      };

      const parsed = parseBlock(block);
      expect(parsed).toEqual(block);
      expect(isGalleryBlock(parsed)).toBe(true);
      if (isGalleryBlock(parsed)) {
        expect(parsed.attributes.columns).toBe(1);
        expect(parsed.innerBlocks?.length).toBe(1);
        expect(parsed.innerBlocks?.[0].name).toBe('core/image');
        expect(parsed.innerBlocks?.[0].attributes.url).toContain('img_2439-1024x599.jpg');
      }
    });
  });

  describe('core/footnotes', () => {
    it('should parse a footnotes block', () => {
      const block = {
        name: 'core/footnotes',
        attributes: {},
      };

      const parsed = parseBlock(block);
      expect(parsed).toEqual(block);
      expect(isFootnotesBlock(parsed)).toBe(true);
    });
  });

  describe('core/block (reusable block)', () => {
    it('should parse a reusable block', () => {
      const block = {
        name: 'core/block',
        attributes: {
          ref: 712,
        },
        innerBlocks: [
          {
            name: 'core/paragraph',
            attributes: {
              content:
                '<em>(p.s. Culture Amp is hiring engineers in Australia and NZ. It\'s the best place I\'ve ever worked. If you\'re interested you can check out <a href="https://www.cultureamp.com/about/careers/">open roles</a> or contact me, <a href="mailto:hello@jasono.co">hello@jasono.co</a>)</em>',
              dropCap: false,
            },
          },
        ],
      };

      const parsed = parseBlock(block);
      expect(parsed).toEqual(block);
      expect(isReusableBlock(parsed)).toBe(true);
      if (isReusableBlock(parsed)) {
        expect(parsed.attributes.ref).toBe(712);
        expect(parsed.innerBlocks?.length).toBe(1);
        expect(parsed.innerBlocks?.[0].name).toBe('core/paragraph');
      }
    });
  });

  describe('parseBlocks', () => {
    it('should parse an array of blocks', () => {
      const blocks = [
        {
          name: 'core/heading',
          attributes: {
            content: 'Test Heading',
            level: 2,
          },
        },
        {
          name: 'core/paragraph',
          attributes: {
            content: 'Test paragraph content',
            dropCap: false,
          },
        },
      ];

      const parsed = parseBlocks({ blocks });
      expect(parsed).toEqual(blocks);
      expect(parsed.length).toBe(2);
      expect(isHeadingBlock(parsed[0])).toBe(true);
      expect(isParagraphBlock(parsed[1])).toBe(true);
    });
  });

  describe('parseFootnotes', () => {
    it('should parse valid footnotes JSON string', () => {
      const footnotes =
        '[{"id":"1","content":"This is footnote 1"},{"id":"2","content":"This is footnote 2"}]';

      const parsed = parseFootnotes(footnotes);
      expect(parsed).toEqual([
        { id: '1', content: 'This is footnote 1' },
        { id: '2', content: 'This is footnote 2' },
      ]);
    });

    it('should return undefined for empty string', () => {
      const parsed = parseFootnotes('');
      expect(parsed).toBeUndefined();
    });

    it('should throw for invalid JSON', () => {
      const invalidJson = '{not valid json';
      expect(() => parseFootnotes(invalidJson)).toThrow();
    });

    it("should throw for JSON that doesn't match the schema", () => {
      const invalidSchema = '[{"wrong_field":"value"}]';
      expect(() => parseFootnotes(invalidSchema)).toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should throw an error for unknown block types', () => {
      const block = {
        name: 'core/unknown-block-type',
        attributes: {
          someAttribute: 'value',
        },
      };

      expect(() => parseBlock(block)).toThrow('Unknown block type: core/unknown-block-type');
    });

    it('should handle blocks with additional unexpected attributes', () => {
      const block = {
        name: 'core/paragraph',
        attributes: {
          content: 'Test content',
          dropCap: false,
          unexpectedAttribute: 'some value',
          anotherOne: 42,
        },
      };

      const parsed = parseBlock(block);
      expect(parsed).toEqual(block);
      expect(isParagraphBlock(parsed)).toBe(true);
      if (isParagraphBlock(parsed)) {
        expect(parsed.attributes.unexpectedAttribute).toBe('some value');
        expect(parsed.attributes.anotherOne).toBe(42);
      }
    });

    it('should handle blocks with missing required attributes by throwing', () => {
      const block = {
        name: 'core/heading',
        attributes: {
          // Missing required 'content' attribute
          level: 2,
        },
      };

      expect(() => parseBlock(block)).toThrow('"message": "Required"');
    });

    it('should handle blocks with invalid attribute types by throwing', () => {
      const block = {
        name: 'core/heading',
        attributes: {
          content: 'Valid content',
          level: 'not a number', // Should be a number
        },
      };

      expect(() => parseBlock(block)).toThrow('Expected number, received string');
    });
  });
});
